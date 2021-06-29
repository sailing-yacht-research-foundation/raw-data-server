const express = require('express');
const multer = require('multer');
const jsonfile = require('jsonfile');
const { v4: uuidv4 } = require('uuid');
const temp = require('temp').track();

const db = require('../models');
const { BadRequestError } = require('../errors');
const validateSecret = require('../middlewares/validateSecret');
const saveISailData = require('../services/saveISailData');
const saveKattackData = require('../services/saveKattackData');
const saveGeoracingData = require('../services/saveGeoracingData');
const saveTracTracData = require('../services/saveTracTracData');
const saveYellowbrickData = require('../services/saveYellowbrickData');
const saveKwindooData = require('../services/saveKwindooData');
const saveBluewaterData = require('../services/saveBluewaterData');
const saveYachtBotData = require('../services/saveYachtBotData');
const saveRaceQsData = require('../services/saveRaceQsData');
const saveMetasailData = require('../services/saveMetasailData');
const saveEstelaData = require('../services/saveEstelaData');
const saveTackTrackerData = require('../services/saveTackTrackerData');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { TRACKER_MAP } = require('../constants');

var router = express.Router();

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    temp.mkdir('jsonfile', function (err, dirPath) {
      if (!err) {
        cb(null, dirPath);
      }
    });
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now());
  },
});

function fileFilter(req, file, cb) {
  if (file.mimetype !== 'application/json') {
    cb(new BadRequestError('Invalid File Type'));
  } else {
    cb(null, true);
  }
}
const upload = multer({ storage, fileFilter });

router.use(validateSecret);
router.get('/', function (req, res) {
  res.json({
    message: 'You are authorized to use this api',
  });
});

router.post(
  '/upload-file',
  upload.single('raw_data'),
  async function (req, res) {
    if (!req.file) {
      res.status(400).json({
        message: 'No File Uploaded',
      });
    } else {
      try {
        const jsonData = await jsonfile.readFile(req.file.path);
        switch (true) {
          case Boolean(jsonData.iSailEvent):
            saveISailData(jsonData);
            break;
          case Boolean(jsonData.KattackRace):
            saveKattackData(jsonData);
            break;
          case Boolean(jsonData.GeoracingEvent):
            saveGeoracingData(jsonData);
            break;
          case Boolean(jsonData.TracTracRace):
            saveTracTracData(jsonData);
            break;
          case Boolean(jsonData.YellowbrickRace):
            saveYellowbrickData(jsonData);
            break;
          case Boolean(jsonData.KwindooRace):
            saveKwindooData(jsonData);
            break;
          case Boolean(jsonData.BluewaterRace):
            saveBluewaterData(jsonData);
            break;
          case Boolean(jsonData.YachtBotRace):
            saveYachtBotData(jsonData);
            break;
          case Boolean(jsonData.RaceQsEvent):
            saveRaceQsData(jsonData);
            break;
          case Boolean(jsonData.MetasailRace):
            saveMetasailData(jsonData);
            break;
          case Boolean(jsonData.EstelaRace):
            saveEstelaData(jsonData);
            break;
          case Boolean(jsonData.TackTrackerRace):
            saveTackTrackerData(jsonData);
            break;
        }
      } catch (err) {
        // TODO: Handle error better
        console.error(err);
      } finally {
        temp.cleanup();
      }
      res.json({
        message: `File successfully uploaded`,
      });
    }
  },
);

router.get('/scraped-url/:tracker', async function (req, res) {
  const { tracker } = req.params;
  let urlToGet = (req.query.status || 'BOTH').toLowerCase();
  let urlList = [];
  let successModel = db[`${TRACKER_MAP[tracker.toLowerCase()]}SuccessfulUrl`];
  let failedModel = db[`${TRACKER_MAP[tracker.toLowerCase()]}FailedUrl`];

  if (urlToGet === 'success' || urlToGet === 'both') {
    if (successModel) {
      let successUrls = await successModel.findAll({
        attributes: ['url', 'original_id'],
        raw: true,
      });
      urlList = [
        ...urlList,
        ...successUrls.map((row) => {
          return {
            url: row.url,
            original_id: row.original_id,
            status: 'success',
          };
        }),
      ];
    }
  }

  if (urlToGet === 'failed' || urlToGet === 'both') {
    if (failedModel) {
      let failedUrls = await failedModel.findAll({
        attributes: ['url'],
        raw: true,
      });
      urlList = [
        ...urlList,
        ...failedUrls.map((row) => {
          return { url: row.url, status: 'failed' };
        }),
      ];
    }
  }
  res.json({
    urlList,
  });
});

router.post('/check-url', async function (req, res) {
  if (
    req.body.tracker == null ||
    (req.body.url == null && req.body.originalId == null)
  ) {
    res
      .status(400)
      .json({ message: 'Must specify tracker, and a url or originalId' });
    return;
  }
  const { tracker, url = null, originalId = null } = req.body;
  let successModel = db[`${TRACKER_MAP[tracker.toLowerCase()]}SuccessfulUrl`];
  let failedModel = db[`${TRACKER_MAP[tracker.toLowerCase()]}FailedUrl`];
  let scrapedDetail = null;

  if (originalId == null && url == null) {
    res.status(400).json({ message: 'Must specify originalId or url' });
    return;
  }

  let whereCondition = url != null ? { url } : { original_id: originalId };

  if (successModel) {
    let successData = await successModel.findOne({
      where: whereCondition,
      raw: true,
    });
    if (successData) {
      scrapedDetail = successData;
    }
  }

  if (failedModel && url != null) {
    // Only for url mode, since failed doesn't have id
    let failedData = await failedModel.findOne({
      where: whereCondition,
      raw: true,
    });
    if (failedData) {
      scrapedDetail = failedData;
    }
  }
  res.json({ scraped: scrapedDetail !== null, scrapedDetail });
});

router.post('/register-failed-url', async function (req, res) {
  if (
    req.body.tracker == null ||
    req.body.url == null ||
    req.body.error == null
  ) {
    res
      .status(400)
      .json({ message: 'Must specify tracker, url, and the error' });
    return;
  }
  const { tracker, url, error } = req.body;
  let failedModel = db[`${TRACKER_MAP[tracker.toLowerCase()]}FailedUrl`];

  const transaction = await db.sequelize.transaction();
  let errorMessage = '';
  try {
    await failedModel.create({
      id: uuidv4(),
      url,
      error,
    });
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    errorMessage = databaseErrorHandler(err);
  }

  res.json({ success: errorMessage == '', errorMessage });
});

module.exports = router;

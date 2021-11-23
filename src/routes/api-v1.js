const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const temp = require('temp');
const fs = require('fs');

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
const {
  downloadAndProcessFiles,
} = require('../services/non-automatable/saveAmericasCup2021Data');
const saveSwiftsureData = require('../services/non-automatable/saveSwiftsureData');
const saveAmericasCupData = require('../services/non-automatable/saveAmericasCupData');
const saveSapData = require('../services/non-automatable/saveSapData');
const saveRegadata = require('../services/non-automatable/saveRegadata/saveRegadata');
const updateYachtBotData = require('../services/non-automatable/updateYachtBotData');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { TRACKER_MAP } = require('../constants');
const { unzipFileFromRequest } = require('../utils/unzipFile');
const saveGeovoileData = require('../services/saveGeovoileData');
const saveOldGeovoileData = require('../services/non-automatable/saveOldGeovoileData');

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
  if (
    file.mimetype !== 'application/json' &&
    file.mimetype !== 'application/gzip'
  ) {
    cb(new BadRequestError('Invalid File Type'));
  } else {
    cb(null, true);
  }
}
const upload = multer({ storage, fileFilter });

router.use(validateSecret);
router.get('/', function (req, res) {
  res.json({
    message: 'ok',
    version: process.env.npm_package_version,
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
      return;
    }
    res.json({
      message: `File successfully uploaded`,
    });
    const isScraperExist = (data, source) =>
      Object.keys(data).some(
        (i) => i.toLowerCase().indexOf(source.toLowerCase()) > -1,
      );
    try {
      const { jsonData } = await unzipFileFromRequest(req);
      switch (true) {
        case isScraperExist(jsonData, TRACKER_MAP.isail):
          saveISailData(jsonData);
          break;
        case isScraperExist(jsonData, TRACKER_MAP.kattack):
          saveKattackData(jsonData);
          break;
        case isScraperExist(jsonData, TRACKER_MAP.georacing):
          saveGeoracingData(jsonData);
          break;
        case isScraperExist(jsonData, TRACKER_MAP.tractrac):
          saveTracTracData(jsonData);
          break;
        case isScraperExist(jsonData, TRACKER_MAP.yellowbrick):
          saveYellowbrickData(jsonData);
          break;
        case isScraperExist(jsonData, TRACKER_MAP.kwindoo):
          saveKwindooData(jsonData);
          break;
        case isScraperExist(jsonData, TRACKER_MAP.bluewater):
          saveBluewaterData(jsonData);
          break;
        case isScraperExist(jsonData, TRACKER_MAP.yachtbot):
          saveYachtBotData(jsonData);
          break;
        case isScraperExist(jsonData, TRACKER_MAP.raceqs):
          saveRaceQsData(jsonData);
          break;
        case isScraperExist(jsonData, TRACKER_MAP.metasail):
          saveMetasailData(jsonData);
          break;
        case isScraperExist(jsonData, TRACKER_MAP.estela):
          saveEstelaData(jsonData);
          break;
        case isScraperExist(jsonData, TRACKER_MAP.tacktracker):
          saveTackTrackerData(jsonData);
          break;
        case isScraperExist(jsonData, TRACKER_MAP.swiftsure):
          saveSwiftsureData(jsonData);
          break;
        case isScraperExist(jsonData, TRACKER_MAP.geovoile):
          saveGeovoileData(jsonData);
          break;
      }
    } catch (err) {
      // TODO: Handle error better
      console.error('error: ', err);
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

router.post('/americas-cup-2021', async function (req, res) {
  if (!req.body.bucketName) {
    res.status(400).json({ message: 'Must specify bucketName' });
    return;
  }
  try {
    downloadAndProcessFiles(req.body.bucketName);
  } catch (err) {
    console.log(err);
  }

  res.json({
    message: `Successfully started processing of files`,
  });
});

router.post('/americas-cup', async function (req, res) {
  if (!req.body.bucketName || !req.body.fileName || !req.body.year) {
    res
      .status(400)
      .json({ message: 'Must specify bucketName, fileName and year in body' });
    return;
  }
  try {
    saveAmericasCupData(
      req.body.bucketName,
      req.body.fileName,
      req.body.year.toString(),
    );
  } catch (err) {
    console.error(err);
  }

  res.json({
    message: `Successfully started processing of files`,
  });
});

router.post('/sap', async function (req, res) {
  if (!req.body.bucketName && !req.body.fileName) {
    res
      .status(400)
      .json({ message: 'Must specify bucketName and fileName in body' });
    return;
  }
  try {
    saveSapData(req.body.bucketName, req.body.fileName);
  } catch (err) {
    console.log(err);
  }

  res.json({
    message: `Successfully started processing of files`,
  });
});

router.post('/regadata', async function (req, res) {
  if (!req.body.bucketName && !req.body.fileName) {
    res
      .status(400)
      .json({ message: 'Must specify bucketName and fileName in body' });
    return;
  }
  try {
    saveRegadata(req.body.bucketName, req.body.fileName);
  } catch (err) {
    console.log(err);
  }

  res.json({
    message: `Successfully started processing of files`,
  });
});

router.post('/yacht-bot', upload.single('raw_data'), async function (req, res) {
  if (!req.file) {
    res.status(400).json({
      message: 'No File Uploaded',
    });
    return;
  }
  res.json({
    message: `File successfully uploaded`,
  });
  try {
    const { jsonData } = await unzipFileFromRequest(req);
    await updateYachtBotData(jsonData);
  } catch (err) {
    console.error('error: ', err);
  }
});

router.post('/old-geovoile', async function (req, res) {
  if (!req.body.bucketName && !req.body.fileName) {
    res
      .status(400)
      .json({ message: 'Must specify bucketName and fileName in body' });
    return;
  }
  try {
    saveOldGeovoileData(req.body.bucketName, req.body.fileName);
  } catch (err) {
    console.log(err);
  }

  res.json({
    message: `Successfully started processing of files`,
  });
});

module.exports = router;

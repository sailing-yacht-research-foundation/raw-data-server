const express = require('express');
const multer = require('multer');
const path = require('path');
const os = require('os');

const { BadRequestError } = require('../errors');
const validateSecret = require('../middlewares/validateSecret');
const validateTrackerSource = require('../middlewares/validateTracker');
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
const saveGeovoileData = require('../services/saveGeovoileData');
const { TRACKER_MAP } = require('../constants');
const { unzipFileFromRequest } = require('../utils/unzipFile');
const {
  getExistingData,
  registerFailure,
} = require('../services/scrapedDataResult');
const {
  getUnfinishedRaces,
  cleanUnfinishedRaces,
} = require('../services/competitionUnit');

var router = express.Router();

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tmpDir = path.resolve(os.tmpdir());
    cb(null, tmpDir);
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
    try {
      const { jsonData } = await unzipFileFromRequest(req);
      const isScraperExist = (data, source) =>
        Object.keys(data).some(
          (i) => i.toLowerCase().indexOf(source.toLowerCase()) > -1,
        );
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
        case isScraperExist(jsonData, TRACKER_MAP.geovoile):
          saveGeovoileData(jsonData);
          break;
      }
    } catch (err) {
      console.error('error: ', err);
      res.status(500).json({ message: 'Internal error occured' });
    }
  },
);

router.get('/scraped-url/:tracker', validateTrackerSource, async (req, res) => {
  const { tracker } = req.params;
  try {
    const urlList = await getExistingData(tracker);
    res.json({
      urlList,
    });
  } catch (err) {
    const errMsg = 'An error occured getting success or failed data';
    console.log(errMsg, err);
    res.status(500).json({ message: errMsg });
  }
});

router.post('/register-failed-url', validateTrackerSource, async (req, res) => {
  const { tracker, url, error } = req.body;
  if (!tracker || !url || !error) {
    res
      .status(400)
      .json({ message: 'Must specify tracker, url, and the error' });
    return;
  }
  try {
    await registerFailure(tracker, url, error);
    res.json({ success: true });
  } catch (err) {
    const errMsg = 'An error occured registering failed url';
    console.log(errMsg, err);
    res.status(500).json({ message: errMsg });
    return;
  }
});

/*
  Returns a list of unfinished race uid used from elastic search to be reused if race has finished
  Also deletes any orphaned elastic search records based from given original id
*/
router.get(
  '/get-unfinished-races/:tracker',
  validateTrackerSource,
  async (req, res) => {
    try {
      const racesMap = await getUnfinishedRaces(req.params.tracker);
      res.json(racesMap);
    } catch (err) {
      console.log(err);
      res.status(500).json({
        message: 'Failed getting unfinished races',
      });
    }
  },
);

router.post(
  '/clean-unfinished-races/:tracker',
  validateTrackerSource,
  async (req, res) => {
    try {
      await cleanUnfinishedRaces(req.params.tracker, req.body.excludedOrigIds);
      res.json({
        message: `Successfully cleaned unfinished race for ${req.params.tracker}`,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({
        message: 'Failed cleaning unfinished races',
      });
    }
  },
);

module.exports = router;

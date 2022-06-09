const express = require('express');
const multer = require('multer');
const temp = require('temp');

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
const {
  downloadAndProcessFiles,
} = require('../services/non-automatable/saveAmericasCup2021Data');
const saveSwiftsureData = require('../services/non-automatable/saveSwiftsureData');
const saveAmericasCupData = require('../services/non-automatable/saveAmericasCupData');
const saveSapData = require('../services/non-automatable/saveSapData');
const saveRegadata = require('../services/non-automatable/saveRegadata/saveRegadata');
const updateYachtBotData = require('../services/non-automatable/updateYachtBotData');
const updateModernGeovoiledata = require('../services/non-automatable/updateModernGeovoiledata');
const { TRACKER_MAP } = require('../constants');
const { unzipFileFromRequest } = require('../utils/unzipFile');
const saveGeovoileData = require('../services/saveGeovoileData');
const saveOldGeovoileData = require('../services/non-automatable/saveOldGeovoileData');
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
        case isScraperExist(jsonData, TRACKER_MAP.swiftsure):
          saveSwiftsureData(jsonData);
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

router.post('/americas-cup-2021', async (req, res) => {
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

router.post(
  '/modern-geovoile',
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
      await updateModernGeovoiledata(jsonData);
    } catch (err) {
      console.error('error: ', err);
    }
  },
);

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

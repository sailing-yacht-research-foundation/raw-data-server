const express = require('express');
const multer = require('multer');
const jsonfile = require('jsonfile');
const temp = require('temp').track();

const { BadRequestError } = require('../errors');
const validateSecret = require('../middlewares/validateSecret');
const saveISailData = require('../services/saveISailData');
const saveKattackData = require('../services/saveKattackData');
const saveGeoracingData = require('../services/saveGeoracingData');
const saveTracTracData = require('../services/saveTracTracData');
const saveYellowbrickData = require('../services/saveYellowbrickData');

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
        if (jsonData.iSailEvent) {
          saveISailData(jsonData);
        }
        if (jsonData.KattackRace) {
          saveKattackData(jsonData);
        }
        if (jsonData.GeoracingEvent) {
          saveGeoracingData(jsonData);
        }
        if (jsonData.TracTracRace) {
          saveTracTracData(jsonData);
        }
        if (jsonData.YellowbrickRace) {
          saveYellowbrickData(jsonData);
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

module.exports = router;

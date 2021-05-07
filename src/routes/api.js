const express = require('express');
const multer = require('multer');
const jsonfile = require('jsonfile');
const temp = require('temp').track();

const validateSecret = require('../middlewares/validateSecret');
const { BadRequestError } = require('../errors');

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

router.post('/upload-file', upload.single('raw_data'), function (req, res) {
  if (req.file) {
    jsonfile
      .readFile(req.file.path)
      .then((jsonData) => {
        // TODO: Save parsed data to database
        console.dir(jsonData);
      })
      .catch((err) => {
        // TODO: Handle error better
        console.error(err);
      })
      .finally(() => {
        temp.cleanup();
      });
  }
  res.json({
    message: `${req.file.originalname} successfully uploaded`,
  });
});

module.exports = router;

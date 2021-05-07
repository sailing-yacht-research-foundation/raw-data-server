const express = require('express');
const multer = require('multer');
const temp = require('temp').track();

const validateSecret = require('../middlewares/validateSecret');
const parsingJsonFile = require('../middlewares/parsingJsonFile');
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

router.post(
  '/upload-file',
  upload.single('raw_data'),
  parsingJsonFile,
  function (req, res) {
    res.json({
      message: `${req.file.originalname} successfully uploaded`,
    });
  },
);

module.exports = router;

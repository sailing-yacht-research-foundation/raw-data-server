var express = require('express');
var router = express.Router();

let validateSecret = require('../middlewares/validateSecret');

router.use(validateSecret);
router.get('/', function (req, res) {
  res.json({
    message: 'You are authorized to use this api',
  });
});

module.exports = router;

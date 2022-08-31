const express = require('express');
const cors = require('cors');

var router = express.Router();

router.get('/healthcheck', cors(), function (req, res) {
  res.json({
    message: 'ok',
    version: process.env.npm_package_version,
    uptime: process.uptime(),
  });
});

module.exports = router;

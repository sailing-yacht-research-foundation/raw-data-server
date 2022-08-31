const express = require('express');

var router = express.Router();

router.get('/healthcheck', function (req, res) {
  res.json({
    message: 'ok',
    version: process.env.npm_package_version,
    uptime: process.uptime(),
  });
});

module.exports = router;

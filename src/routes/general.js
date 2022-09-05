const express = require('express');
const cors = require('cors');

const modelVersion = require('../syrf-schema/package.json').version;

var router = express.Router();

router.get('/healthcheck', cors(), function (req, res) {
  res.json({
    message: 'ok',
    version: process.env.npm_package_version,
    modelVersion,
    uptime: process.uptime(),
  });
});

module.exports = router;

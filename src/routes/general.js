const express = require('express');
const failedUrlDataAccess = require('../syrf-schema/dataAccess/v1/scrapedFailedUrl');
const successfulUrlDataAccess = require('../syrf-schema/dataAccess/v1/scrapedSuccessfulUrl');
const validateSecret = require('../middlewares/validateSecret');

const modelVersion = require('../syrf-schema/package.json').version;

var router = express.Router();
router.use(validateSecret);

router.get('/healthcheck', (req, res) => {
  res.json({
    message: 'ok',
    version: process.env.npm_package_version,
    modelVersion,
    uptime: process.uptime(),
  });
});

router.get('/status/last-races', async (req, res) => {
  const successUrls = await successfulUrlDataAccess.getLastRacePerScrapedSource();

  res.send({
    successUrls: successUrls.map((row) => {
      return {
        source: row.source,
        url: row.url,
        createdAt: row.createdAt.getTime(),
      };
    }),
  });
});

router.get('/status/failures', async (req, res) => {
  const failedUrls = await failedUrlDataAccess.getAllWithPaging(req.query.page, req.query.size, { excludeNoPositions: req.query.excludeNoPositions });

  res.send({
    failedUrls: failedUrls.map((row) => {
      return {
        url: row.url,
        errorMessage: row.error,
        createdAt: row.createdAt.getTime(),
      };
    }),
  });
});

module.exports = router;

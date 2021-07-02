const express = require('express');

const apiV1 = require('./routes/api-v1');
const { errorHandler } = require('./errors');
const { processGeoracingData } = require('./services/processGeoracingData');

function createServer() {
  const app = express();
  app.use(express.json());

  app.use(
    express.urlencoded({
      extended: true,
    }),
  );
  app.use(require('express-status-monitor')());

  app.get('/', async (req, res) => {
    res.send('SYRF - Raw Data Server');
  });

  app.get('/process', async (req, res) => {
    await processGeoracingData('./geoparquet.parquet');
    res.send('SYRF - Processing georacing data');
  });

  app.use('/api/v1', apiV1);
  app.use(errorHandler);
  return app;
}

module.exports = createServer;

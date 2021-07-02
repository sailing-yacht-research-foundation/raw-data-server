const express = require('express');

const apiV1 = require('./routes/api-v1');
const { errorHandler } = require('./errors');
const { processGeoracingData } = require('./services/processGeoracingData');
const { processEstelaData } = require('./services/processEstelaData');
const { processBluewaterData } = require('./services/processBluewaterData');

function createServer() {
  const app = express();
  app.use(express.json());

  app.use(
    express.urlencoded({
      extended: true,
    }),
  );
  if (process.env.NODE_ENV !== 'test') {
    app.use(require('express-status-monitor')());
  }

  app.get('/', async (req, res) => {
    res.send('SYRF - Raw Data Server');
  });

  app.get('/georacing', async (req, res) => {
    await processGeoracingData({
      main: './georacing.parquet',
      position: './georacingpos.parquet',
    });
    res.send('SYRF - Processing georacing data');
  });

  app.get('/estela', async (req, res) => {
    await processEstelaData({
      main: './estela.parquet',
      position: './estelapos.parquet',
    });
    res.send('SYRF - Processing estela data');
  });

  app.get('/bluewater', async (req, res) => {
    await processBluewaterData({
      main: './bluewater.parquet',
      position: './bluewaterpos.parquet',
    });
    res.send('SYRF - Processing bluewater data');
  });

  app.use('/api/v1', apiV1);
  app.use(errorHandler);
  return app;
}

module.exports = createServer;

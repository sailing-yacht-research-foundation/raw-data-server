const express = require('express');

const apiV1 = require('./routes/api-v1');
const db = require('./models');
const { errorHandler } = require('./errors');
// const processISailData = require('./services/processISailData');
const readParquet = require('./services/readParquet');
const processGeoracingData = require('./services/processGeoracingData');

function createServer() {
  const app = express();
  app.use(express.json());
  db.sequelize.sync();

  app.use(
    express.urlencoded({
      extended: true,
    }),
  );
  app.get('/', async (req, res) => {
    res.send('SYRF - Raw Data Server');
  });
  app.get('/test-write', async (req, res) => {
    const fileUrl = await processGeoracingData();
    res.json({ fileUrl });
    // res.send('SYRF - Raw Data Server');
  });
  app.get('/test-read', async (req, res) => {
    const data = await readParquet('./iSailCombined.parquet');
    console.log(data);
    res.json(data);
    // res.send('SYRF - Raw Data Server');
  });
  app.use('/api/v1', apiV1);
  app.use(errorHandler);
  return app;
}

module.exports = createServer;

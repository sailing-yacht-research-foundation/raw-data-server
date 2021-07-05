const express = require('express');

const apiV1 = require('./routes/api-v1');
const { errorHandler } = require('./errors');
const { processGeoracingData } = require('./services/processGeoracingData');
const { processEstelaData } = require('./services/processEstelaData');
const { processBluewaterData } = require('./services/processBluewaterData');
const { processISailData } = require('./services/processISailData');
const { processKattackData } = require('./services/processKattackData');
const { processKwindooData } = require('./services/processKwindooData');
const { processMetasailData } = require('./services/processMetasailData');
const { processRaceQsData } = require('./services/processRaceQsData');
const { processTackTrackerData } = require('./services/processTackTrackerData');
const { processTracTracData } = require('./services/processTracTracData');
const { processYachtBotData } = require('./services/processYachtBotData');
const { processYellowbrickData } = require('./services/processYellowbrickData');

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

  app.get('/isail', async (req, res) => {
    await processISailData({
      main: './isail.parquet',
      position: './isailpos.parquet',
    });
    res.send('SYRF - Processing iSail data');
  });

  app.get('/kattack', async (req, res) => {
    await processKattackData({
      main: './kattack.parquet',
      position: './kattackpos.parquet',
    });
    res.send('SYRF - Processing kattack data');
  });

  app.get('/kwindoo', async (req, res) => {
    await processKwindooData({
      main: './kwindoo.parquet',
      position: './kwindoopos.parquet',
    });
    res.send('SYRF - Processing kwindoo data');
  });

  app.get('/metasail', async (req, res) => {
    await processMetasailData({
      main: './metasail.parquet',
      position: './metasailpos.parquet',
    });
    res.send('SYRF - Processing metasail data');
  });

  app.get('/raceqs', async (req, res) => {
    await processRaceQsData({
      main: './raceqs.parquet',
      position: './raceqspos.parquet',
    });
    res.send('SYRF - Processing race qs data');
  });

  app.get('/tacktracker', async (req, res) => {
    await processTackTrackerData({
      main: './tacktracker.parquet',
      position: './tacktrackerpos.parquet',
    });
    res.send('SYRF - Processing tacktracker data');
  });

  app.get('/tractrac', async (req, res) => {
    await processTracTracData({
      main: './tractrac.parquet',
      position: './tractracpos.parquet',
    });
    res.send('SYRF - Processing tractrac data');
  });

  app.get('/yachtbot', async (req, res) => {
    await processYachtBotData({
      main: './yachtbot.parquet',
      position: './yachtbotpos.parquet',
    });
    res.send('SYRF - Processing Yacht bot data');
  });

  app.get('/yellowbrick', async (req, res) => {
    await processYellowbrickData({
      main: './yellowbrick.parquet',
      position: './yellowbrickpos.parquet',
    });
    res.send('SYRF - Processing Yellowbrick data');
  });

  app.use('/api/v1', apiV1);
  app.use(errorHandler);
  return app;
}

module.exports = createServer;

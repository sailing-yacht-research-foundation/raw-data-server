const express = require('express');

const apiV1 = require('./routes/api-v1');
const db = require('./models');
const { errorHandler } = require('./errors');
const processISailData = require('./services/processISailData');

function createServer() {
  const app = express();
  app.use(express.json());
  db.sequelize.sync();

  app.use(
    express.urlencoded({
      extended: true,
    }),
  );
  app.get('/', (req, res) => {
    res.send('SYRF - Raw Data Server');
  });
  app.get('/test', async (req, res) => {
    const downloadUri = await processISailData();
    res.json({ status: 'success', downloadUri });
  });
  app.use('/api/v1', apiV1);
  app.use(errorHandler);
  return app;
}

module.exports = createServer;

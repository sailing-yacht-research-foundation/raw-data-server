const express = require('express');

const apiV1 = require('./routes/api-v1');
const testing = require('./routes/testing');
const { errorHandler } = require('./errors');

function createServer() {
  const app = express();
  app.use(express.json());

  app.use(
    express.urlencoded({
      extended: true,
    }),
  );
  app.get('/', async (req, res) => {
    res.send('SYRF - Raw Data Server');
  });

  app.use('/api/v1', apiV1);
  app.use('/api/testing', testing);
  app.use(errorHandler);
  return app;
}

module.exports = createServer;

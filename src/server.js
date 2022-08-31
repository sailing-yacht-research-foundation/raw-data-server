const express = require('express');
const cors = require('cors');

const apiV1 = require('./routes/api-v1');
const generalRoutes = require('./routes/general');
const { errorHandler } = require('./errors');

function createServer() {
  const app = express();
  app.use(express.json());
  app.use(cors());

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

  app.use('/', generalRoutes);
  app.use('/api/v1', apiV1);
  app.use(errorHandler);
  return app;
}

module.exports = createServer;

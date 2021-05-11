const express = require('express');

const api = require('./routes/api');
const db = require('./models');
const { errorHandler } = require('./errors');

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
  app.use('/api', api);
  app.use(errorHandler);
  return app;
}

module.exports = createServer;

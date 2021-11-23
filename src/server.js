const express = require('express');

const apiV1 = require('./routes/api-v1');
const { errorHandler } = require('./errors');

function createServer() {
  const app = express();
  // default settings is 100KB for express.json
  app.use(
    express.json({
      limit: Number.parseInt(process.env.DEFAULT_JSON_PARSER_FILE || '1000000'),
    }),
  );

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

  app.use('/api/v1', apiV1);
  app.use(errorHandler);
  return app;
}

module.exports = createServer;

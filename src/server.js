const express = require('express');

const api = require('./routes/api');
const { errorHandler } = require('./errors');

const app = express();
const port = 3000;

const initApp = async () => {
  app.use(express.json());
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

  app.listen(port, () => {
    console.log(`Raw Data Server: listening at PORT:${port}`);
  });
};

initApp();

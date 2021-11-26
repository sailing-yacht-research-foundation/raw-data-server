require('dotenv').config();
const path = require('path');
const { Sequelize, sequelize } = require('../src/models/index');
const Umzug = require('umzug');

const umzug = new Umzug({
  migrations: {
    params: [
      sequelize.getQueryInterface(),
      Sequelize, // Sequelize constructor - the required module
    ],
    path: path.join(__dirname, '..', 'migrations'),
    pattern: /\.js$/,
  },
  storage: 'sequelize',
  storageOptions: {
    sequelize,
  },
  context: sequelize.getQueryInterface(),
  logging: console.log,
});

(async () => {
  // Checks migrations and run them if they are not already applied. To keep
  // track of the executed migrations, a table (and sequelize model) called SequelizeMeta
  // will be automatically created (if it doesn't exist already) and parsed.
  if (process.argv[2] === 'down') {
    await umzug.down();
  } else {
    await umzug.up();
  }
})();

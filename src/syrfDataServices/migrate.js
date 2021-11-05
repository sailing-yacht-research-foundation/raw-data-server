require('dotenv').config();
const path = require('path');
const { Sequelize } = require('sequelize');
const Umzug = require('umzug');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
  },
);

const umzug = new Umzug({
  migrations: {
    params: [
      sequelize.getQueryInterface(),
      Sequelize, // Sequelize constructor - the required module
    ],
    path: path.join(process.cwd(), 'src', 'syrf-schema', 'migrations'),
    pattern: /\.js$/,
  },
  storage: 'sequelize',
  storageOptions: {
    sequelize: sequelize,
  },
  context: sequelize.getQueryInterface(),
  logger: console,
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

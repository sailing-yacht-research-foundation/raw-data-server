require('dotenv').config();
module.exports = {
  host: process.env.DB_RAW_DATA_HOST || 'localhost',
  port: process.env.DB_RAW_DATA_PORT || '5432',
  username: process.env.DB_RAW_DATA_USER || 'postgres',
  password: process.env.DB_RAW_DATA_PASSWORD || 'password',
  database:
    process.env.NODE_ENV === 'test'
      ? 'test_db'
      : process.env.DB_RAW_DATA_NAME || 'sources',
  dialect: 'postgres',
  pool: {
    max: 30,
    min: 0,
    acquire: 30000,
    idle: process.env.NODE_ENV === 'test' ? 500 : 10000,
  },
  migrationStorage: 'sequelize',
  migrationStorageTableName: 'SequelizeMeta',
  seederStorage: 'sequelize',
  seederStorageTableName: 'SequelizeSeed',
};

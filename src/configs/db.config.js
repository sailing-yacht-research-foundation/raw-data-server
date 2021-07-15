module.exports = {
  HOST: process.env.DB_HOST || 'localhost',
  PORT: process.env.DB_PORT || '3306',
  USER: process.env.DB_USER || 'user',
  PASSWORD: process.env.DB_PASSWORD || 'password',
  DB:
    process.env.NODE_ENV === 'test'
      ? 'test_db'
      : process.env.DB_NAME || 'mysql',
  dialect: 'mysql',
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: process.env.NODE_ENV === 'test' ? 500 : 10000,
  },
};

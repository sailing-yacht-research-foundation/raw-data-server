module.exports = {
  HOST: process.env.DB_HOST || 'localhost',
  PORT: process.env.DB_PORT || '3306',
  USER: process.env.DB_USER || 'database_user',
  PASSWORD: process.env.DB_PASSWORD || 'database_password',
  DB:
    process.env.NODE_ENV === 'test'
      ? 'test-db'
      : process.env.DB_NAME || 'database_name',
  dialect: 'mysql',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: process.env.NODE_ENV === 'test' ? 500 : 10000,
  },
};

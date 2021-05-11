const Sequelize = require('sequelize');
const dbConfig = require('../configs/db.config.js');

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  port: dbConfig.PORT,
  dialect: dbConfig.dialect,
  operatorsAliases: '0',
  logging: false,
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.iSailClass = require('./iSailClass.model.js')(sequelize, Sequelize);
db.iSailEvent = require('./iSailEvent.model.js')(sequelize, Sequelize);
db.iSailEventParticipant = require('./iSailEventParticipant.model.js')(
  sequelize,
  Sequelize,
);
db.iSailRace = require('./iSailRace.model.js')(sequelize, Sequelize);

module.exports = db;

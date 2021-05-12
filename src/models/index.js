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

// === iSail ===
db.iSailClass = require('./iSail/iSailClass.model.js')(sequelize, Sequelize);
db.iSailEvent = require('./iSail/iSailEvent.model.js')(sequelize, Sequelize);
db.iSailEventParticipant = require('./iSail/iSailEventParticipant.model.js')(
  sequelize,
  Sequelize,
);
db.iSailEventTracksData = require('./iSail/iSailEventTracksData.model.js')(
  sequelize,
  Sequelize,
);
db.iSailRace = require('./iSail/iSailRace.model.js')(sequelize, Sequelize);
db.iSailTrack = require('./iSail/iSailTrack.model.js')(sequelize, Sequelize);
db.iSailPosition = require('./iSail/iSailPosition.model.js')(
  sequelize,
  Sequelize,
);
db.iSailMark = require('./iSail/iSailMark.model.js')(sequelize, Sequelize);
db.iSailStartline = require('./iSail/iSailStartline.model.js')(
  sequelize,
  Sequelize,
);
db.iSailCourseMark = require('./iSail/iSailCourseMark.model.js')(
  sequelize,
  Sequelize,
);
db.iSailRounding = require('./iSail/iSailRounding.model.js')(
  sequelize,
  Sequelize,
);
db.iSailResult = require('./iSail/iSailResult.model.js')(sequelize, Sequelize);
// === End of iSail ===

module.exports = db;

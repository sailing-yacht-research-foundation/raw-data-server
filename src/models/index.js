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

// === Kattack ===
db.kattackYachtClub = require('./kattack/kattackYachtClub.model.js')(
  sequelize,
  Sequelize,
);
db.kattackRace = require('./kattack/kattackRace.model.js')(
  sequelize,
  Sequelize,
);
db.kattackDevice = require('./kattack/kattackDevice.model.js')(
  sequelize,
  Sequelize,
);
db.kattackPosition = require('./kattack/kattackPosition.model.js')(
  sequelize,
  Sequelize,
);
db.kattackWaypoint = require('./kattack/kattackWaypoint.model.js')(
  sequelize,
  Sequelize,
);
// === End of Kattack ===

// === Georacing ===
db.georacingEvent = require('./georacing/georacingEvent.model')(
  sequelize,
  Sequelize,
);
db.georacingRace = require('./georacing/georacingRace.model')(
  sequelize,
  Sequelize,
);
db.georacingActor = require('./georacing/georacingActor.model')(
  sequelize,
  Sequelize,
);
db.georacingWeather = require('./georacing/georacingWeather.model')(
  sequelize,
  Sequelize,
);
db.georacingCourse = require('./georacing/georacingCourse.model')(
  sequelize,
  Sequelize,
);
db.georacingCourseObject = require('./georacing/georacingCourseObject.model')(
  sequelize,
  Sequelize,
);
db.georacingCourseElement = require('./georacing/georacingCourseElement.model')(
  sequelize,
  Sequelize,
);
db.georacingGroundPlace = require('./georacing/georacingGroundPlace.model')(
  sequelize,
  Sequelize,
);
db.georacingPosition = require('./georacing/georacingPosition.model')(
  sequelize,
  Sequelize,
);
db.georacingLine = require('./georacing/georacingLine.model')(
  sequelize,
  Sequelize,
);
db.georacingSplittime = require('./georacing/georacingSplittime.model')(
  sequelize,
  Sequelize,
);
db.georacingSplittimeObject =
  require('./georacing/georacingSplittimeObject.model')(sequelize, Sequelize);
// === End of Georacing ===

// === TracTrac ===
db.sailorEmail = require('./tractrac/sailorEmail.model')(sequelize, Sequelize);
db.tractracClass = require('./tractrac/tractracClass.model')(
  sequelize,
  Sequelize,
);
db.tractracCompetitor = require('./tractrac/tractracCompetitor.model')(
  sequelize,
  Sequelize,
);
db.tractracCompetitorPassing =
  require('./tractrac/tractracCompetitorPassing.model')(sequelize, Sequelize);
db.tractracCompetitorPosition =
  require('./tractrac/tractracCompetitorPosition.model')(sequelize, Sequelize);
db.tractracCompetitorResult =
  require('./tractrac/tractracCompetitorResult.model')(sequelize, Sequelize);
db.tractracControl = require('./tractrac/tractracControl.model')(
  sequelize,
  Sequelize,
);
db.tractracControlPoint = require('./tractrac/tractracControlPoint.model')(
  sequelize,
  Sequelize,
);
db.tractracControlPointPosition =
  require('./tractrac/tractracControlPointPosition.model')(
    sequelize,
    Sequelize,
  );
db.tractracEvent = require('./tractrac/tractracEvent.model')(
  sequelize,
  Sequelize,
);
db.tractracRace = require('./tractrac/tractracRace.model')(
  sequelize,
  Sequelize,
);
db.tractracRaceClass = require('./tractrac/tractracRaceClass.model')(
  sequelize,
  Sequelize,
);
db.tractracRoute = require('./tractrac/tractracRoute.model')(
  sequelize,
  Sequelize,
);
// === End of TracTrac ===

// === Yellowbrick ===
db.yellowbrickCourseNode = require('./yellowbrick/yellowbrickCourseNode.model')(
  sequelize,
  Sequelize,
);
db.yellowbrickLeaderboardTeam =
  require('./yellowbrick/yellowbrickLeaderboardTeam.model')(
    sequelize,
    Sequelize,
  );
db.yellowbrickPoi = require('./yellowbrick/yellowbrickPoi.model')(
  sequelize,
  Sequelize,
);
db.yellowbrickPosition = require('./yellowbrick/yellowbrickPosition.model')(
  sequelize,
  Sequelize,
);
db.yellowbrickRace = require('./yellowbrick/yellowbrickRace.model')(
  sequelize,
  Sequelize,
);
db.yellowbrickTag = require('./yellowbrick/yellowbrickTag.model')(
  sequelize,
  Sequelize,
);
db.yellowbrickTeam = require('./yellowbrick/yellowbrickTeam.model')(
  sequelize,
  Sequelize,
);
// === End of Yellowbrick ===

module.exports = db;

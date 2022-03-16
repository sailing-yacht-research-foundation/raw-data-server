const Sequelize = require('sequelize');
const dbConfig = require('../configs/db.config.js');

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    operatorsAliases: '0',
    logging: false,
    pool: {
      max: dbConfig.pool.max,
      min: dbConfig.pool.min,
      acquire: dbConfig.pool.acquire,
      idle: dbConfig.pool.idle,
    },
  },
);

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
db.iSailFailedUrl = require('./iSail/iSailFailedUrl.model.js')(
  sequelize,
  Sequelize,
);
db.iSailSuccessfulUrl = require('./iSail/iSailSuccessfulUrl.model.js')(
  sequelize,
  Sequelize,
);
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
db.kattackSuccessfulUrl = require('./kattack/kattackSuccessfulUrl.model.js')(
  sequelize,
  Sequelize,
);
db.kattackFailedUrl = require('./kattack/kattackFailedUrl.model.js')(
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
db.georacingSuccessfulUrl = require('./georacing/georacingSuccessfulUrl.model')(
  sequelize,
  Sequelize,
);
db.georacingFailedUrl = require('./georacing/georacingFailedUrl.model')(
  sequelize,
  Sequelize,
);
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
db.tractracFailedUrl = require('./tractrac/tractracFailedUrl.model')(
  sequelize,
  Sequelize,
);
db.tractracSuccessfulUrl = require('./tractrac/tractracSuccessfulUrl.model')(
  sequelize,
  Sequelize,
);

db.tractracEvent.hasMany(db.tractracRace, {
  foreignKey: 'event',
  constraints: false,
})

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
db.yellowbrickSuccessfulUrl =
  require('./yellowbrick/yellowbrickSuccessfulUrl.model')(sequelize, Sequelize);
db.yellowbrickFailedUrl = require('./yellowbrick/yellowbrickFailedUrl.model')(
  sequelize,
  Sequelize,
);
// === End of Yellowbrick ===

// === Kwindoo ===
db.kwindooBoat = require('./kwindoo/kwindooBoat.model')(sequelize, Sequelize);
db.kwindooRace = require('./kwindoo/kwindooRace.model')(sequelize, Sequelize);
db.kwindooRegatta = require('./kwindoo/kwindooRegatta.model')(
  sequelize,
  Sequelize,
);
db.kwindooRegattaOwner = require('./kwindoo/kwindooRegattaOwner.model')(
  sequelize,
  Sequelize,
);
db.kwindooComment = require('./kwindoo/kwindooComment.model')(
  sequelize,
  Sequelize,
);
db.kwindooHomeportLocation = require('./kwindoo/kwindooHomeportLocation.model')(
  sequelize,
  Sequelize,
);
db.kwindooMarker = require('./kwindoo/kwindooMarker.model')(
  sequelize,
  Sequelize,
);
db.kwindooMIA = require('./kwindoo/kwindooMIA.model')(sequelize, Sequelize);
db.kwindooPOI = require('./kwindoo/kwindooPOI.model')(sequelize, Sequelize);
db.kwindooPosition = require('./kwindoo/kwindooPosition.model')(
  sequelize,
  Sequelize,
);
db.kwindooRunningGroup = require('./kwindoo/kwindooRunningGroup.model')(
  sequelize,
  Sequelize,
);
db.kwindooVideoStream = require('./kwindoo/kwindooVideoStream.model')(
  sequelize,
  Sequelize,
);
db.kwindooWaypoint = require('./kwindoo/kwindooWaypoint.model')(
  sequelize,
  Sequelize,
);
db.kwindooFailedUrl = require('./kwindoo/kwindooFailedUrl.model')(
  sequelize,
  Sequelize,
);
db.kwindooSuccessfulUrl = require('./kwindoo/kwindooSuccessfulUrl.model')(
  sequelize,
  Sequelize,
);
// === End of Kwindoo ===

// === Bluewater ===
db.bluewaterRace = require('./bluewater/bluewaterRace.model')(
  sequelize,
  Sequelize,
);
db.bluewaterBoat = require('./bluewater/bluewaterBoat.model')(
  sequelize,
  Sequelize,
);
db.bluewaterBoatHandicap = require('./bluewater/bluewaterBoatHandicap.model')(
  sequelize,
  Sequelize,
);
db.bluewaterBoatSocialMedia =
  require('./bluewater/bluewaterBoatSocialMedia.model')(sequelize, Sequelize);
db.bluewaterCrew = require('./bluewater/bluewaterCrew.model')(
  sequelize,
  Sequelize,
);
db.bluewaterCrewSocialMedia =
  require('./bluewater/bluewaterCrewSocialMedia.model')(sequelize, Sequelize);
db.bluewaterMap = require('./bluewater/bluewaterMap.model')(
  sequelize,
  Sequelize,
);
db.bluewaterPosition = require('./bluewater/bluewaterPosition.model')(
  sequelize,
  Sequelize,
);
db.bluewaterAnnouncement = require('./bluewater/bluewaterAnnouncement.model')(
  sequelize,
  Sequelize,
);
db.bluewaterFailedUrl = require('./bluewater/bluewaterFailedUrl.model')(
  sequelize,
  Sequelize,
);
db.bluewaterSuccessfulUrl = require('./bluewater/bluewaterSuccessfulUrl.model')(
  sequelize,
  Sequelize,
);
// === End of Bluewater ===

// === Yacht Bot ===
db.yachtBotRace = require('./yachtbot/yachtBotRace.model')(
  sequelize,
  Sequelize,
);
db.yachtBotBuoy = require('./yachtbot/yachtBotBuoy.model')(
  sequelize,
  Sequelize,
);
db.yachtBotYacht = require('./yachtbot/yachtBotYacht.model')(
  sequelize,
  Sequelize,
);
db.yachtBotPosition = require('./yachtbot/yachtBotPosition.model')(
  sequelize,
  Sequelize,
);
db.yachtBotMark = require('./yachtbot/yachtBotMark.model')(
  sequelize,
  Sequelize,
);
db.yachtBotSuccessfulUrl = require('./yachtbot/yachtBotSuccessfulUrl.model')(
  sequelize,
  Sequelize,
);
db.yachtBotFailedUrl = require('./yachtbot/yachtBotFailedUrl.model')(
  sequelize,
  Sequelize,
);
// === End of Yacht Bot ===

// === RaceQs ===
db.raceQsRegatta = require('./raceQs/raceQsRegatta.model')(
  sequelize,
  Sequelize,
);
db.raceQsEvent = require('./raceQs/raceQsEvent.model')(sequelize, Sequelize);
db.raceQsDivision = require('./raceQs/raceQsDivision.model')(
  sequelize,
  Sequelize,
);
db.raceQsParticipant = require('./raceQs/raceQsParticipant.model')(
  sequelize,
  Sequelize,
);
db.raceQsPosition = require('./raceQs/raceQsPosition.model')(
  sequelize,
  Sequelize,
);
db.raceQsRoute = require('./raceQs/raceQsRoute.model')(sequelize, Sequelize);
db.raceQsStart = require('./raceQs/raceQsStart.model')(sequelize, Sequelize);
db.raceQsWaypoint = require('./raceQs/raceQsWaypoint.model')(
  sequelize,
  Sequelize,
);
db.raceQsSuccessfulUrl = require('./raceQs/raceQsSuccessfulUrl.model')(
  sequelize,
  Sequelize,
);
db.raceQsFailedUrl = require('./raceQs/raceQsFailedUrl.model')(
  sequelize,
  Sequelize,
);
// === End of RaceQs ===

// === Metasail ===
db.metasailEvent = require('./metasail/metasailEvent.model')(
  sequelize,
  Sequelize,
);
db.metasailRace = require('./metasail/metasailRace.model')(
  sequelize,
  Sequelize,
);
db.metasailBoat = require('./metasail/metasailBoat.model')(
  sequelize,
  Sequelize,
);
db.metasailBuoy = require('./metasail/metasailBuoy.model')(
  sequelize,
  Sequelize,
);
db.metasailGate = require('./metasail/metasailGate.model')(
  sequelize,
  Sequelize,
);
db.metasailPosition = require('./metasail/metasailPosition.model')(
  sequelize,
  Sequelize,
);
db.metasailFailedUrl = require('./metasail/metasailFailedUrl.model')(
  sequelize,
  Sequelize,
);
db.metasailSuccessfulUrl = require('./metasail/metasailSuccessfulUrl.model')(
  sequelize,
  Sequelize,
);
// === End of Metasail ===

// === Estela ===
db.estelaBuoy = require('./estela/estelaBuoy.model')(sequelize, Sequelize);
db.estelaClub = require('./estela/estelaClub.model')(sequelize, Sequelize);
db.estelaDorsal = require('./estela/estelaDorsal.model')(sequelize, Sequelize);
db.estelaPlayer = require('./estela/estelaPlayer.model')(sequelize, Sequelize);
db.estelaPosition = require('./estela/estelaPosition.model')(
  sequelize,
  Sequelize,
);
db.estelaRace = require('./estela/estelaRace.model')(sequelize, Sequelize);
db.estelaResult = require('./estela/estelaResult.model')(sequelize, Sequelize);
db.estelaSuccessfulUrl = require('./estela/estelaSuccessfulUrl.model')(
  sequelize,
  Sequelize,
);
db.estelaFailedUrl = require('./estela/estelaFailedUrl.model')(
  sequelize,
  Sequelize,
);
// === End of Estela ===

// === TackTracker ===
db.tackTrackerBoat = require('./tackTracker/tackTrackerBoat.model')(
  sequelize,
  Sequelize,
);
db.tackTrackerDefault = require('./tackTracker/tackTrackerDefault.model')(
  sequelize,
  Sequelize,
);
db.tackTrackerFinish = require('./tackTracker/tackTrackerFinish.model')(
  sequelize,
  Sequelize,
);
db.tackTrackerMark = require('./tackTracker/tackTrackerMark.model')(
  sequelize,
  Sequelize,
);
db.tackTrackerPosition = require('./tackTracker/tackTrackerPosition.model')(
  sequelize,
  Sequelize,
);
db.tackTrackerRace = require('./tackTracker/tackTrackerRace.model')(
  sequelize,
  Sequelize,
);
db.tackTrackerRegatta = require('./tackTracker/tackTrackerRegatta.model')(
  sequelize,
  Sequelize,
);
db.tackTrackerStart = require('./tackTracker/tackTrackerStart.model')(
  sequelize,
  Sequelize,
);
db.tackTrackerFailedUrl = require('./tackTracker/tackTrackerFailedUrl.model')(
  sequelize,
  Sequelize,
);
db.tackTrackerSuccessfulUrl =
  require('./tackTracker/tackTrackerSuccessfulUrl.model')(sequelize, Sequelize);

db.tackTrackerRegatta.hasMany(db.tackTrackerRace, {
  foreignKey: 'regatta',
  constraints: false,
})
// === End of TackTracker ===

// === Swiftsure ===
db.swiftsureBoat = require('./swiftsure/swiftsureBoat.model')(
  sequelize,
  Sequelize,
);
db.swiftsureLine = require('./swiftsure/swiftsureLine.model')(
  sequelize,
  Sequelize,
);
db.swiftsureLink = require('./swiftsure/swiftsureLink.model')(
  sequelize,
  Sequelize,
);
db.swiftsureMark = require('./swiftsure/swiftsureMark.model')(
  sequelize,
  Sequelize,
);
db.swiftsurePoint = require('./swiftsure/swiftsurePoint.model')(
  sequelize,
  Sequelize,
);
db.swiftsurePosition = require('./swiftsure/swiftsurePosition.model')(
  sequelize,
  Sequelize,
);
db.swiftsureRace = require('./swiftsure/swiftsureRace.model')(
  sequelize,
  Sequelize,
);
db.swiftsureSponsor = require('./swiftsure/swiftsureSponsor.model')(
  sequelize,
  Sequelize,
);
// === End of Swiftsure ===

// === Americascup2021 ===
db.americasCup2021Boat = require('./americascup2021/americasCup2021Boat.model')(
  sequelize,
  Sequelize,
);
db.americasCup2021BoatLeftFoilPosition =
  require('./americascup2021/americasCup2021BoatLeftFoilPosition.model')(
    sequelize,
    Sequelize,
  );
db.americasCup2021BoatLeftFoilState =
  require('./americascup2021/americasCup2021BoatLeftFoilState.model')(
    sequelize,
    Sequelize,
  );
db.americasCup2021BoatLeg =
  require('./americascup2021/americasCup2021BoatLeg.model')(
    sequelize,
    Sequelize,
  );
db.americasCup2021BoatPenalty =
  require('./americascup2021/americasCup2021BoatPenalty.model')(
    sequelize,
    Sequelize,
  );
db.americasCup2021BoatPosition =
  require('./americascup2021/americasCup2021BoatPosition.model')(
    sequelize,
    Sequelize,
  );
db.americasCup2021BoatProtest =
  require('./americascup2021/americasCup2021BoatProtest.model')(
    sequelize,
    Sequelize,
  );
db.americasCup2021BoatRank =
  require('./americascup2021/americasCup2021BoatRank.model')(
    sequelize,
    Sequelize,
  );
db.americasCup2021BoatRightFoilPosition =
  require('./americascup2021/americasCup2021BoatRightFoilPosition.model')(
    sequelize,
    Sequelize,
  );
db.americasCup2021BoatRightFoilState =
  require('./americascup2021/americasCup2021BoatRightFoilState.model')(
    sequelize,
    Sequelize,
  );
db.americasCup2021BoatRudderAngle =
  require('./americascup2021/americasCup2021BoatRudderAngle.model')(
    sequelize,
    Sequelize,
  );
db.americasCup2021BoatSow =
  require('./americascup2021/americasCup2021BoatSow.model')(
    sequelize,
    Sequelize,
  );
db.americasCup2021BoatStatus =
  require('./americascup2021/americasCup2021BoatStatus.model')(
    sequelize,
    Sequelize,
  );
db.americasCup2021BoatTwd =
  require('./americascup2021/americasCup2021BoatTwd.model')(
    sequelize,
    Sequelize,
  );
db.americasCup2021BoatTws =
  require('./americascup2021/americasCup2021BoatTws.model')(
    sequelize,
    Sequelize,
  );
db.americasCup2021BoatVmg =
  require('./americascup2021/americasCup2021BoatVmg.model')(
    sequelize,
    Sequelize,
  );
db.americasCup2021BoundaryPacket =
  require('./americascup2021/americasCup2021BoundaryPacket.model')(
    sequelize,
    Sequelize,
  );
db.americasCup2021BoundaryPacket =
  require('./americascup2021/americasCup2021BoundaryPacket.model')(
    sequelize,
    Sequelize,
  );
db.americasCup2021Buoy = require('./americascup2021/americasCup2021Buoy.model')(
  sequelize,
  Sequelize,
);
db.americasCup2021BuoyPosition =
  require('./americascup2021/americasCup2021BuoyPosition.model')(
    sequelize,
    Sequelize,
  );
db.americasCup2021BuoyPositionState =
  require('./americascup2021/americasCup2021BuoyPositionState.model')(
    sequelize,
    Sequelize,
  );
db.americasCup2021Race = require('./americascup2021/americasCup2021Race.model')(
  sequelize,
  Sequelize,
);
db.americasCup2021RaceStatus =
  require('./americascup2021/americasCup2021RaceStatus.model')(
    sequelize,
    Sequelize,
  );
db.americasCup2021Ranking =
  require('./americascup2021/americasCup2021Ranking.model')(
    sequelize,
    Sequelize,
  );
db.americasCup2021RoundingTime =
  require('./americascup2021/americasCup2021RoundingTime.model')(
    sequelize,
    Sequelize,
  );
db.americasCup2021Team = require('./americascup2021/americasCup2021Team.model')(
  sequelize,
  Sequelize,
);
db.americasCup2021WindData =
  require('./americascup2021/americasCup2021WindData.model')(
    sequelize,
    Sequelize,
  );
db.americasCup2021WindPoint =
  require('./americascup2021/americasCup2021WindPoint.model')(
    sequelize,
    Sequelize,
  );
// === End of Americascup2021 ===

// === Americas Cup ===
db.americasCupAvgWind =
  require('./americascup/americasCupAvgWind.model')(
    sequelize,
    Sequelize,
  );
db.americasCupBoat =
  require('./americascup/americasCupBoat.model')(
    sequelize,
    Sequelize,
  );
db.americasCupBoatShape =
  require('./americascup/americasCupBoatShape.model')(
    sequelize,
    Sequelize,
  );
db.americasCupCompoundMark =
  require('./americascup/americasCupCompoundMark.model')(
    sequelize,
    Sequelize,
  );
db.americasCupCourseLimit =
  require('./americascup/americasCupCourseLimit.model')(
    sequelize,
    Sequelize,
  );
db.americasCupEvent =
  require('./americascup/americasCupEvent.model')(
    sequelize,
    Sequelize,
  );
db.americasCupMark =
  require('./americascup/americasCupMark.model')(
    sequelize,
    Sequelize,
  );
db.americasCupRace =
  require('./americascup/americasCupRace.model')(
    sequelize,
    Sequelize,
  );
db.americasCupRegatta =
  require('./americascup/americasCupRegatta.model')(
    sequelize,
    Sequelize,
  );
db.americasCupPosition =
  require('./americascup/americasCupPosition.model')(
    sequelize,
    Sequelize,
  );
// === End of Americas Cup ===

db.sapCompetitor = require('./sap/SapCompetitor.model')(sequelize, Sequelize);
db.sapCompetitorBoat = require('./sap/SapCompetitorBoat.model')(
  sequelize,
  Sequelize,
);
db.sapCompetitorBoatPosition = require('./sap/SapCompetitorBoatPosition.model')(
  sequelize,
  Sequelize,
);
db.sapCompetitorLeg = require('./sap/SapCompetitorLeg.model')(
  sequelize,
  Sequelize,
);
db.sapCompetitorManeuver = require('./sap/SapCompetitorManeuver.model')(
  sequelize,
  Sequelize,
);
db.sapMark = require('./sap/SapMark.model')(sequelize, Sequelize);
db.sapCompetitorMarkPosition = require('./sap/SapCompetitorMarkPosition.model')(
  sequelize,
  Sequelize,
);
db.sapCompetitorMarkPassing = require('./sap/SapCompetitorMarkPassing.model')(
  sequelize,
  Sequelize,
);
db.sapCourse = require('./sap/SapCourse.model')(sequelize, Sequelize);
db.sapRace = require('./sap/SapRace.model')(sequelize, Sequelize);
db.sapTargetTimeLeg = require('./sap/SapTargetTimeLeg.model')(
  sequelize,
  Sequelize,
);
db.sapWindSummary = require('./sap/SapWindSummary.model')(sequelize, Sequelize);
// === End of SAP ===

// === Start Regadata ===
db.regadataRace = require('./regadata/RegadataRace.model')(
  sequelize,
  Sequelize,
);

db.regadataSail = require('./regadata/RegadataSail.model')(
  sequelize,
  Sequelize,
);

db.regadataReport = require('./regadata/RegadataReport.model')(
  sequelize,
  Sequelize,
);
// === End of Regadata ===

// === Geovoile ===
db.geovoileRace = require('./geovoile/GeovoileRace.model')(
  sequelize,
  Sequelize,
);
db.geovoileBoat = require('./geovoile/GeovoileBoat.model')(
  sequelize,
  Sequelize,
);
db.geovoileBoatPosition = require('./geovoile/GeovoileBoatPosition.model')(
  sequelize,
  Sequelize,
);
db.geovoileBoatSailor = require('./geovoile/GeovoileBoatSailor.model')(
  sequelize,
  Sequelize,
);
db.geovoileSuccessfulUrl = require('./geovoile/geovoileSuccessfulUrl.model')(
  sequelize,
  Sequelize,
);
db.geovoileFailedUrl = require('./geovoile/GeovoileFailedUrl.model')(
  sequelize,
  Sequelize,
);
db.GeovoileGeometry = require('./geovoile/GeovoileGeometry.model')(
  sequelize,
  Sequelize,
);
db.GeovoileGeometryGate = require('./geovoile/GeovoileGeometryGate.model')(
  sequelize,
  Sequelize,
);
db.geovoileMark = require('./geovoile/GeovoileMark.model')(
  sequelize,
  Sequelize,
);
// === End of Geovoile ===

// === Start Old Geovoile ===
db.oldGeovoileRace = require('./old-geovoile/OldGeovoileRace.model')(
  sequelize,
  Sequelize,
);
db.oldGeovoileBoat = require('./old-geovoile/OldGeovoileBoat.model')(
  sequelize,
  Sequelize,
);
db.oldGeovoileBoatPosition =
  require('./old-geovoile/OldGeovoileBoatPosition.model')(sequelize, Sequelize);

// === End of Old Geovoile ===
// === Normalized Table ===
db.readyAboutRaceMetadata =
  require('./normalizedTable/readyAboutRaceMetadata.model')(
    sequelize,
    Sequelize,
  );
db.readyAboutTrackGeoJsonLookup =
  require('./normalizedTable/readyAboutTrackGeoJsonLookup.model')(
    sequelize,
    Sequelize,
  );
// === End of Normalized Table ===

// === Live Data Server ===
db.liveDataPoint = require('./liveData/liveDataPoint.model')(
  sequelize,
  Sequelize,
);
// === End of Live Data Server ===
module.exports = db;

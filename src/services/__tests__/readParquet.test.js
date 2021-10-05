const path = require('path');
const fs = require('fs');
const axios = require('axios');

const db = require('../../models');
const readParquet = require('../readParquet');

const saveBluewaterData = require('../saveBluewaterData');
const { processBluewaterData } = require('../processBluewaterData');
const bluewaterData = require('../../test-files/bluewater.json');

const saveEstelaData = require('../saveEstelaData');
const { processEstelaData } = require('../processEstelaData');
const estelaData = require('../../test-files/estela.json');

const saveGeoracingData = require('../saveGeoracingData');
const { processGeoracingData } = require('../processGeoracingData');
const georacingData = require('../../test-files/georacing.json');

const saveISailData = require('../saveISailData');
const { processISailData } = require('../processISailData');
const iSailData = require('../../test-files/iSail.json');

const saveKattackData = require('../saveKattackData');
const { processKattackData } = require('../processKattackData');
const kattackData = require('../../test-files/kattack.json');

const saveKwindooData = require('../saveKwindooData');
const { processKwindooData } = require('../processKwindooData');
const kwindooData = require('../../test-files/kwindoo.json');

const saveMetasailData = require('../saveMetasailData');
const { processMetasailData } = require('../processMetasailData');
const metasailData = require('../../test-files/metasail.json');

const saveRaceQsData = require('../saveRaceQsData');
const { processRaceQsData } = require('../processRaceQsData');
const raceQsData = require('../../test-files/raceQs.json');

const saveTackTrackerData = require('../saveTackTrackerData');
const { processTackTrackerData } = require('../processTackTrackerData');
const tackTrackerData = require('../../test-files/tackTracker.json');

const saveTracTracData = require('../saveTracTracData');
const { processTracTracData } = require('../processTracTracData');
const tractracData = require('../../test-files/tractrac.json');

const saveYachtBotData = require('../saveYachtBotData');
const { processYachtBotData } = require('../processYachtBotData');
const yachtBotData = require('../../test-files/yachtBot.json');

const saveYellowbrickData = require('../saveYellowbrickData');
const { processYellowbrickData } = require('../processYellowbrickData');
const yellowbrickData = require('../../test-files/yellowbrick.json');

jest.setTimeout(120000);
describe('Basic read parquet functionality', () => {
  it('should read parquet files successfully', async () => {
    const filePath = path.resolve(
      __dirname,
      '../../test-files/georacing.parquet',
    );
    const processRecord = jest.fn();
    await readParquet(filePath, processRecord);
    expect(processRecord).toHaveBeenCalledTimes(2);
  });

  it('should return failed when reader is unable to open the file', async () => {
    const processRecord = jest.fn();
    const readResult = await readParquet(
      'randomfolder/test.parquet',
      processRecord,
    );
    expect(processRecord).not.toHaveBeenCalled();
    expect(readResult).toEqual(
      expect.objectContaining({
        success: false,
        errorMessage: expect.stringContaining('ENOENT'),
      }),
    );
  });
});

it('should return failed when error thrown from process function ', async () => {
  const processRecord = () => {
    throw new Error('test');
  };
  const filePath = path.resolve(
    __dirname,
    '../../test-files/georacing.parquet',
  );
  const readResult = await readParquet(filePath, processRecord);
  expect(readResult).toEqual(
    expect.objectContaining({
      success: false,
      errorMessage: 'test',
    }),
  );
});

describe('Read tracker parquet files', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
    jest.spyOn(axios, 'post').mockImplementation(() => Promise.resolve());
    await saveBluewaterData(bluewaterData);
    await saveEstelaData(estelaData);
    await saveGeoracingData(georacingData);
    await saveISailData(iSailData);
    await saveKattackData(kattackData);
    await saveKwindooData(kwindooData);
    await saveMetasailData(metasailData);
    await saveRaceQsData(raceQsData);
    await saveTackTrackerData(tackTrackerData);
    await saveTracTracData(tractracData);
    await saveYachtBotData(yachtBotData);
    await saveYellowbrickData(yellowbrickData);
  });
  afterAll(async () => {
    jest.resetAllMocks();
    await db.bluewaterRace.destroy({ truncate: true });
    await db.bluewaterBoat.destroy({ truncate: true });
    await db.bluewaterBoatHandicap.destroy({ truncate: true });
    await db.bluewaterBoatSocialMedia.destroy({ truncate: true });
    await db.bluewaterCrew.destroy({ truncate: true });
    await db.bluewaterCrewSocialMedia.destroy({ truncate: true });
    await db.bluewaterMap.destroy({ truncate: true });
    await db.bluewaterPosition.destroy({ truncate: true });
    await db.bluewaterAnnouncement.destroy({ truncate: true });

    await db.estelaRace.destroy({ truncate: true });
    await db.estelaClub.destroy({ truncate: true });
    await db.estelaBuoy.destroy({ truncate: true });
    await db.estelaDorsal.destroy({ truncate: true });
    await db.estelaResult.destroy({ truncate: true });
    await db.estelaPlayer.destroy({ truncate: true });
    await db.estelaPosition.destroy({ truncate: true });

    await db.georacingEvent.destroy({ truncate: true });
    await db.georacingRace.destroy({ truncate: true });
    await db.georacingActor.destroy({ truncate: true });
    await db.georacingWeather.destroy({ truncate: true });
    await db.georacingCourse.destroy({ truncate: true });
    await db.georacingCourseElement.destroy({ truncate: true });
    await db.georacingCourseObject.destroy({ truncate: true });
    await db.georacingGroundPlace.destroy({ truncate: true });
    await db.georacingLine.destroy({ truncate: true });
    await db.georacingPosition.destroy({ truncate: true });
    await db.georacingSplittime.destroy({ truncate: true });
    await db.georacingSplittimeObject.destroy({ truncate: true });

    await db.iSailClass.destroy({ truncate: true });
    await db.iSailEvent.destroy({ truncate: true });
    await db.iSailRace.destroy({ truncate: true });
    await db.iSailEventParticipant.destroy({ truncate: true });
    await db.iSailEventTracksData.destroy({ truncate: true });
    await db.iSailPosition.destroy({ truncate: true });
    await db.iSailTrack.destroy({ truncate: true });
    await db.iSailMark.destroy({ truncate: true });
    await db.iSailStartline.destroy({ truncate: true });
    await db.iSailCourseMark.destroy({ truncate: true });
    await db.iSailRounding.destroy({ truncate: true });
    await db.iSailResult.destroy({ truncate: true });

    await db.kattackYachtClub.destroy({ truncate: true });
    await db.kattackRace.destroy({ truncate: true });
    await db.kattackDevice.destroy({ truncate: true });
    await db.kattackPosition.destroy({ truncate: true });
    await db.kattackWaypoint.destroy({ truncate: true });

    await db.kwindooRegattaOwner.destroy({ truncate: true });
    await db.kwindooRegatta.destroy({ truncate: true });
    await db.kwindooRace.destroy({ truncate: true });
    await db.kwindooBoat.destroy({ truncate: true });
    await db.kwindooComment.destroy({ truncate: true });
    await db.kwindooHomeportLocation.destroy({ truncate: true });
    await db.kwindooMarker.destroy({ truncate: true });
    await db.kwindooMIA.destroy({ truncate: true });
    await db.kwindooPOI.destroy({ truncate: true });
    await db.kwindooPosition.destroy({ truncate: true });
    await db.kwindooRunningGroup.destroy({ truncate: true });
    await db.kwindooVideoStream.destroy({ truncate: true });
    await db.kwindooWaypoint.destroy({ truncate: true });

    await db.metasailEvent.destroy({ truncate: true });
    await db.metasailRace.destroy({ truncate: true });
    await db.metasailBoat.destroy({ truncate: true });
    await db.metasailBuoy.destroy({ truncate: true });
    await db.metasailGate.destroy({ truncate: true });
    await db.metasailPosition.destroy({ truncate: true });

    await db.raceQsRegatta.destroy({ truncate: true });
    await db.raceQsEvent.destroy({ truncate: true });
    await db.raceQsDivision.destroy({ truncate: true });
    await db.raceQsParticipant.destroy({ truncate: true });
    await db.raceQsPosition.destroy({ truncate: true });
    await db.raceQsRoute.destroy({ truncate: true });
    await db.raceQsStart.destroy({ truncate: true });
    await db.raceQsWaypoint.destroy({ truncate: true });

    await db.tackTrackerRegatta.destroy({ truncate: true });
    await db.tackTrackerRace.destroy({ truncate: true });
    await db.tackTrackerBoat.destroy({ truncate: true });
    await db.tackTrackerDefault.destroy({ truncate: true });
    await db.tackTrackerFinish.destroy({ truncate: true });
    await db.tackTrackerMark.destroy({ truncate: true });
    await db.tackTrackerPosition.destroy({ truncate: true });
    await db.tackTrackerStart.destroy({ truncate: true });

    await db.tractracEvent.destroy({ truncate: true });
    await db.tractracRace.destroy({ truncate: true });
    await db.tractracClass.destroy({ truncate: true });
    await db.tractracRaceClass.destroy({ truncate: true });
    await db.tractracClass.destroy({ truncate: true });
    await db.tractracCompetitor.destroy({ truncate: true });
    await db.tractracCompetitorPassing.destroy({ truncate: true });
    await db.tractracCompetitorPosition.destroy({ truncate: true });
    await db.tractracCompetitorResult.destroy({ truncate: true });
    await db.tractracControl.destroy({ truncate: true });
    await db.tractracControlPoint.destroy({ truncate: true });
    await db.tractracControlPointPosition.destroy({ truncate: true });
    await db.tractracRoute.destroy({ truncate: true });
    await db.sailorEmail.destroy({ truncate: true });

    await db.yachtBotRace.destroy({ truncate: true });
    await db.yachtBotBuoy.destroy({ truncate: true });
    await db.yachtBotPosition.destroy({ truncate: true });
    await db.yachtBotYacht.destroy({ truncate: true });

    await db.yellowbrickRace.destroy({ truncate: true });
    await db.yellowbrickPosition.destroy({ truncate: true });
    await db.yellowbrickPoi.destroy({ truncate: true });
    await db.yellowbrickCourseNode.destroy({ truncate: true });
    await db.yellowbrickLeaderboardTeam.destroy({ truncate: true });
    await db.yellowbrickTag.destroy({ truncate: true });
    await db.yellowbrickTeam.destroy({ truncate: true });

    await db.readyAboutRaceMetadata.destroy({ truncate: true });
    await db.readyAboutTrackGeoJsonLookup.destroy({ truncate: true });

    await db.sequelize.close();
  });
  it.only('test sample', () => {
    expect(1).toBe(1);
  })
  it('should read Bluewater parquet files successfully', async () => {
    let mainPath = path.resolve(
      __dirname,
      '../../test-files/bluewater-test.parquet',
    );
    let positionPath = path.resolve(
      __dirname,
      '../../test-files/bluewater-position-test.parquet',
    );
    await processBluewaterData({ main: mainPath, position: positionPath });

    const processRecord = jest.fn();
    await readParquet(mainPath, processRecord);
    expect(processRecord).toHaveBeenCalledTimes(bluewaterData.BluewaterRace.length);
    expect(processRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        race_id: bluewaterData.BluewaterRace[0].id,
        race_original_id: bluewaterData.BluewaterRace[0].original_id,
      }),
    );
    fs.unlink(mainPath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
    fs.unlink(positionPath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
  });

  it('should read Estela parquet files successfully', async () => {
    let mainPath = path.resolve(
      __dirname,
      '../../test-files/estela-test.parquet',
    );
    let positionPath = path.resolve(
      __dirname,
      '../../test-files/estela-position-test.parquet',
    );
    await processEstelaData({ main: mainPath, position: positionPath });

    const processRecord = jest.fn();
    await readParquet(mainPath, processRecord);
    expect(processRecord).toHaveBeenCalledTimes(estelaData.EstelaRace.length);
    expect(processRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        race_id: estelaData.EstelaRace[0].id,
        race_original_id: estelaData.EstelaRace[0].original_id,
      }),
    );
    fs.unlink(mainPath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
    fs.unlink(positionPath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
  });

  it('should read Georacing parquet files successfully', async () => {
    let mainPath = path.resolve(
      __dirname,
      '../../test-files/georacing-test.parquet',
    );
    let positionPath = path.resolve(
      __dirname,
      '../../test-files/georacing-position-test.parquet',
    );
    await processGeoracingData({ main: mainPath, position: positionPath });

    const processRecord = jest.fn();
    await readParquet(mainPath, processRecord);
    expect(processRecord).toHaveBeenCalledTimes(georacingData.GeoracingEvent.length);
    expect(processRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        event_id: georacingData.GeoracingEvent[0].id,
        name: georacingData.GeoracingEvent[0].name,
      }),
    );
    fs.unlink(mainPath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
    fs.unlink(positionPath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
  });

  it('should read iSail parquet files successfully', async () => {
    let mainPath = path.resolve(
      __dirname,
      '../../test-files/estela-test.parquet',
    );
    let positionPath = path.resolve(
      __dirname,
      '../../test-files/estela-position-test.parquet',
    );
    await processISailData({ main: mainPath, position: positionPath });

    const processRecord = jest.fn();
    await readParquet(mainPath, processRecord);
    expect(processRecord).toHaveBeenCalledTimes(iSailData.iSailEvent.length);
    expect(processRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        event_id: iSailData.iSailEvent[0].id,
        name: iSailData.iSailEvent[0].name,
      }),
    );

    fs.unlink(mainPath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
    fs.unlink(positionPath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
  });

  it('should read Kattack parquet files successfully', async () => {
    let mainPath = path.resolve(
      __dirname,
      '../../test-files/kattack-test.parquet',
    );
    let positionPath = path.resolve(
      __dirname,
      '../../test-files/kattack-position-test.parquet',
    );

    await processKattackData({ main: mainPath, position: positionPath });

    const processRecord = jest.fn();
    await readParquet(mainPath, processRecord);
    expect(processRecord).toHaveBeenCalledTimes(kattackData.KattackRace.length);
    expect(processRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        race_id: kattackData.KattackRace[0].id,
        name: kattackData.KattackRace[0].name,
      }),
    );

    fs.unlink(mainPath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
    fs.unlink(positionPath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
  });

  it('should read Kwindoo parquet files successfully', async () => {
    let mainPath = path.resolve(
      __dirname,
      '../../test-files/kwindoo-test.parquet',
    );
    let positionPath = path.resolve(
      __dirname,
      '../../test-files/kwindoo-position-test.parquet',
    );

    await processKwindooData({ main: mainPath, position: positionPath });

    const processRecord = jest.fn();
    await readParquet(mainPath, processRecord);
    expect(processRecord).toHaveBeenCalledTimes(kwindooData.KwindooRegatta.length);
    expect(processRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        regatta_id: kwindooData.KwindooRegatta[0].id,
        name: kwindooData.KwindooRegatta[0].name,
      }),
    );

    fs.unlink(mainPath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
    fs.unlink(positionPath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
  });

  it('should read Metasail parquet files successfully', async () => {
    let mainPath = path.resolve(
      __dirname,
      '../../test-files/metasail-test.parquet',
    );
    let positionPath = path.resolve(
      __dirname,
      '../../test-files/metasail-position-test.parquet',
    );
    await processMetasailData({ main: mainPath, position: positionPath });

    const processRecord = jest.fn();
    await readParquet(mainPath, processRecord);
    expect(processRecord).toHaveBeenCalledTimes(metasailData.MetasailRace.length);
    expect(processRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        race_id: metasailData.MetasailRace[0].id,
        name: metasailData.MetasailRace[0].name,
      }),
    );

    fs.unlink(mainPath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
    fs.unlink(positionPath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
  });

  it('should read RaceQs parquet files successfully', async () => {
    let mainPath = path.resolve(
      __dirname,
      '../../test-files/raceqs-test.parquet',
    );
    let positionPath = path.resolve(
      __dirname,
      '../../test-files/raceqs-position-test.parquet',
    );

    await processRaceQsData({ main: mainPath, position: positionPath });

    const processRecord = jest.fn();
    await readParquet(mainPath, processRecord);
    expect(processRecord).toHaveBeenCalledTimes(raceQsData.RaceQsEvent.length);
    expect(processRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        event_id: raceQsData.RaceQsEvent[0].id,
        event_original_id: raceQsData.RaceQsEvent[0].original_id,
      }),
    );

    fs.unlink(mainPath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
    fs.unlink(positionPath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
  });

  it('should read TackTracker parquet files successfully', async () => {
    let mainPath = path.resolve(
      __dirname,
      '../../test-files/tacktracker-test.parquet',
    );
    let positionPath = path.resolve(
      __dirname,
      '../../test-files/tacktracker-position-test.parquet',
    );
    await processTackTrackerData({ main: mainPath, position: positionPath });

    const processRecord = jest.fn();
    await readParquet(mainPath, processRecord);
    expect(processRecord).toHaveBeenCalledTimes(tackTrackerData.TackTrackerRace.length);
    expect(processRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        race_id: tackTrackerData.TackTrackerRace[0].id,
        race_original_id: tackTrackerData.TackTrackerRace[0].original_id,
      }),
    );

    fs.unlink(mainPath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
    fs.unlink(positionPath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
  });

  it('should read Trac Trac parquet files successfully', async () => {
    let mainPath = path.resolve(
      __dirname,
      '../../test-files/tacktracker-test.parquet',
    );
    let positionPath = path.resolve(
      __dirname,
      '../../test-files/tacktracker-position-test.parquet',
    );
    await processTracTracData({ main: mainPath, position: positionPath });

    const processRecord = jest.fn();
    await readParquet(mainPath, processRecord);
    expect(processRecord).toHaveBeenCalledTimes(tractracData.TracTracRace.length);
    expect(processRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        race_id: tractracData.TracTracRace[0].id,
        original_race_id: tractracData.TracTracRace[0].original_id,
      }),
    );
    fs.unlink(mainPath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
    fs.unlink(positionPath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
  });

  it('should read Yacht Bot parquet files successfully', async () => {
    let mainPath = path.resolve(
      __dirname,
      '../../test-files/yachtbot-test.parquet',
    );
    let positionPath = path.resolve(
      __dirname,
      '../../test-files/yachtbot-position-test.parquet',
    );
    await processYachtBotData({ main: mainPath, position: positionPath });

    const processRecord = jest.fn();
    await readParquet(mainPath, processRecord);
    expect(processRecord).toHaveBeenCalledTimes(yachtBotData.YachtBotRace.length);
    expect(processRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        race_id: yachtBotData.YachtBotRace[0].id,
        race_original_id: yachtBotData.YachtBotRace[0].original_id,
        name: yachtBotData.YachtBotRace[0].name,
      }),
    );
    fs.unlink(mainPath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
    fs.unlink(positionPath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
  });

  it('should read Yellowbrick parquet files successfully', async () => {
    let mainPath = path.resolve(
      __dirname,
      '../../test-files/yachtbot-test.parquet',
    );
    let positionPath = path.resolve(
      __dirname,
      '../../test-files/yachtbot-position-test.parquet',
    );
    await processYellowbrickData({ main: mainPath, position: positionPath });

    const processRecord = jest.fn();
    await readParquet(mainPath, processRecord);
    expect(processRecord).toHaveBeenCalledTimes(yellowbrickData.YellowbrickRace.length);
    expect(processRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        race_id: yellowbrickData.YellowbrickRace[0].id,
        tz: yellowbrickData.YellowbrickRace[0].tz,
        tz_offset: yellowbrickData.YellowbrickRace[0].tz_offset,
      }),
    );
    fs.unlink(mainPath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
    fs.unlink(positionPath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
  });
});

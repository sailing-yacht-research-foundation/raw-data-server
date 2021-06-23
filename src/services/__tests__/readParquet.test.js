const path = require('path');
const fs = require('fs');

const db = require('../../models');
const readParquet = require('../readParquet');
const uploadFileToS3 = require('../uploadFileToS3');

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

jest.mock('../uploadFileToS3', () => jest.fn());

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

describe('Read tracker parquet files', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
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
    await db.bluewaterRace.destroy({
      truncate: true,
    });
    await db.bluewaterBoat.destroy({
      truncate: true,
    });
    await db.bluewaterBoatHandicap.destroy({
      truncate: true,
    });
    await db.bluewaterBoatSocialMedia.destroy({
      truncate: true,
    });
    await db.bluewaterCrew.destroy({
      truncate: true,
    });
    await db.bluewaterCrewSocialMedia.destroy({
      truncate: true,
    });
    await db.bluewaterMap.destroy({
      truncate: true,
    });
    await db.bluewaterPosition.destroy({
      truncate: true,
    });

    await db.estelaRace.destroy({
      truncate: true,
    });
    await db.estelaClub.destroy({
      truncate: true,
    });
    await db.estelaBuoy.destroy({
      truncate: true,
    });
    await db.estelaDorsal.destroy({
      truncate: true,
    });
    await db.estelaResult.destroy({
      truncate: true,
    });
    await db.estelaPlayer.destroy({
      truncate: true,
    });
    await db.estelaPosition.destroy({
      truncate: true,
    });

    await db.georacingEvent.destroy({
      truncate: true,
    });
    await db.georacingRace.destroy({
      truncate: true,
    });
    await db.georacingActor.destroy({
      truncate: true,
    });
    await db.georacingWeather.destroy({
      truncate: true,
    });
    await db.georacingCourse.destroy({
      truncate: true,
    });
    await db.georacingCourseElement.destroy({
      truncate: true,
    });
    await db.georacingCourseObject.destroy({
      truncate: true,
    });
    await db.georacingGroundPlace.destroy({
      truncate: true,
    });
    await db.georacingLine.destroy({
      truncate: true,
    });
    await db.georacingPosition.destroy({
      truncate: true,
    });
    await db.georacingSplittime.destroy({
      truncate: true,
    });
    await db.georacingSplittimeObject.destroy({
      truncate: true,
    });

    await db.iSailClass.destroy({
      truncate: true,
    });
    await db.iSailEvent.destroy({
      truncate: true,
    });
    await db.iSailRace.destroy({
      truncate: true,
    });
    await db.iSailEventParticipant.destroy({
      truncate: true,
    });
    await db.iSailEventTracksData.destroy({
      truncate: true,
    });
    await db.iSailPosition.destroy({
      truncate: true,
    });
    await db.iSailTrack.destroy({
      truncate: true,
    });
    await db.iSailMark.destroy({
      truncate: true,
    });
    await db.iSailStartline.destroy({
      truncate: true,
    });
    await db.iSailCourseMark.destroy({
      truncate: true,
    });
    await db.iSailRounding.destroy({
      truncate: true,
    });
    await db.iSailResult.destroy({
      truncate: true,
    });

    await db.kattackYachtClub.destroy({
      truncate: true,
    });
    await db.kattackRace.destroy({
      truncate: true,
    });
    await db.kattackDevice.destroy({
      truncate: true,
    });
    await db.kattackPosition.destroy({
      truncate: true,
    });
    await db.kattackWaypoint.destroy({
      truncate: true,
    });

    await db.kwindooRegattaOwner.destroy({
      truncate: true,
    });
    await db.kwindooRegatta.destroy({
      truncate: true,
    });
    await db.kwindooRace.destroy({
      truncate: true,
    });
    await db.kwindooBoat.destroy({
      truncate: true,
    });
    await db.kwindooComment.destroy({
      truncate: true,
    });
    await db.kwindooHomeportLocation.destroy({
      truncate: true,
    });
    await db.kwindooMarker.destroy({
      truncate: true,
    });
    await db.kwindooMIA.destroy({
      truncate: true,
    });
    await db.kwindooPOI.destroy({
      truncate: true,
    });
    await db.kwindooPosition.destroy({
      truncate: true,
    });
    await db.kwindooRunningGroup.destroy({
      truncate: true,
    });
    await db.kwindooVideoStream.destroy({
      truncate: true,
    });
    await db.kwindooWaypoint.destroy({
      truncate: true,
    });

    await db.metasailEvent.destroy({
      truncate: true,
    });
    await db.metasailRace.destroy({
      truncate: true,
    });
    await db.metasailBoat.destroy({
      truncate: true,
    });
    await db.metasailBuoy.destroy({
      truncate: true,
    });
    await db.metasailGate.destroy({
      truncate: true,
    });
    await db.metasailPosition.destroy({
      truncate: true,
    });

    await db.raceQsRegatta.destroy({
      truncate: true,
    });
    await db.raceQsEvent.destroy({
      truncate: true,
    });
    await db.raceQsDivision.destroy({
      truncate: true,
    });
    await db.raceQsParticipant.destroy({
      truncate: true,
    });
    await db.raceQsPosition.destroy({
      truncate: true,
    });
    await db.raceQsRoute.destroy({
      truncate: true,
    });
    await db.raceQsStart.destroy({
      truncate: true,
    });
    await db.raceQsWaypoint.destroy({
      truncate: true,
    });

    await db.tackTrackerRegatta.destroy({
      truncate: true,
    });
    await db.tackTrackerRace.destroy({
      truncate: true,
    });
    await db.tackTrackerBoat.destroy({
      truncate: true,
    });
    await db.tackTrackerDefault.destroy({
      truncate: true,
    });
    await db.tackTrackerFinish.destroy({
      truncate: true,
    });
    await db.tackTrackerMark.destroy({
      truncate: true,
    });
    await db.tackTrackerPosition.destroy({
      truncate: true,
    });
    await db.tackTrackerStart.destroy({
      truncate: true,
    });

    await db.tractracEvent.destroy({
      truncate: true,
    });
    await db.tractracRace.destroy({
      truncate: true,
    });
    await db.tractracClass.destroy({
      truncate: true,
    });
    await db.tractracRaceClass.destroy({
      truncate: true,
    });
    await db.tractracClass.destroy({
      truncate: true,
    });
    await db.tractracCompetitor.destroy({
      truncate: true,
    });
    await db.tractracCompetitorPassing.destroy({
      truncate: true,
    });
    await db.tractracCompetitorPosition.destroy({
      truncate: true,
    });
    await db.tractracCompetitorResult.destroy({
      truncate: true,
    });
    await db.tractracControl.destroy({
      truncate: true,
    });
    await db.tractracControlPoint.destroy({
      truncate: true,
    });
    await db.tractracControlPointPosition.destroy({
      truncate: true,
    });
    await db.tractracRoute.destroy({
      truncate: true,
    });
    await db.sailorEmail.destroy({
      truncate: true,
    });

    await db.yachtBotRace.destroy({
      truncate: true,
    });
    await db.yachtBotBuoy.destroy({
      truncate: true,
    });
    await db.yachtBotPosition.destroy({
      truncate: true,
    });
    await db.yachtBotYacht.destroy({
      truncate: true,
    });

    await db.yellowbrickRace.destroy({
      truncate: true,
    });
    await db.yellowbrickPosition.destroy({
      truncate: true,
    });
    await db.yellowbrickPoi.destroy({
      truncate: true,
    });
    await db.yellowbrickCourseNode.destroy({
      truncate: true,
    });
    await db.yellowbrickLeaderboardTeam.destroy({
      truncate: true,
    });
    await db.yellowbrickTag.destroy({
      truncate: true,
    });
    await db.yellowbrickTeam.destroy({
      truncate: true,
    });

    await db.sequelize.close();
  });

  it('should read Bluewater parquet files successfully', async () => {
    uploadFileToS3.mockResolvedValueOnce('mockFilePath');

    let bluewaterPath = path.resolve(
      __dirname,
      '../../test-files/bluewater-test.parquet',
    );
    await processBluewaterData(bluewaterPath);

    const processRecord = jest.fn();
    await readParquet(bluewaterPath, processRecord);
    expect(processRecord).toHaveBeenCalledTimes(1);
    expect(processRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        race_id: '74314800-9ccb-4f52-a37f-82e01b2afe80',
        race_original_id: '605b1b069dbcc81862098de5',
      }),
    );
    fs.unlink(bluewaterPath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
  });

  it('should read Estela parquet files successfully', async () => {
    uploadFileToS3.mockResolvedValueOnce('mockFilePath');

    let filePath = path.resolve(
      __dirname,
      '../../test-files/estela-test.parquet',
    );
    await processEstelaData(filePath);

    const processRecord = jest.fn();
    await readParquet(filePath, processRecord);
    expect(processRecord).toHaveBeenCalledTimes(2);
    expect(processRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        race_id: 'f6373964-9496-46ba-b907-fa90f8c6fb62',
        race_original_id: '6985',
      }),
    );
    fs.unlink(filePath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
  });

  it('should read Georacing parquet files successfully', async () => {
    uploadFileToS3.mockResolvedValueOnce('mockFilePath');

    let filePath = path.resolve(
      __dirname,
      '../../test-files/georacing-test.parquet',
    );
    await processGeoracingData(filePath);

    const processRecord = jest.fn();
    await readParquet(filePath, processRecord);
    expect(processRecord).toHaveBeenCalledTimes(2);
    expect(processRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        event_id: '54503929-7f8d-4627-a40b-e7dca635a3dd',
        name: 'Beargrease Sled Dog',
      }),
    );
    fs.unlink(filePath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
  });

  it('should read iSail parquet files successfully', async () => {
    uploadFileToS3.mockResolvedValueOnce('mockFilePath');

    let filePath = path.resolve(
      __dirname,
      '../../test-files/isail-test.parquet',
    );
    await processISailData(filePath);

    const processRecord = jest.fn();
    await readParquet(filePath, processRecord);
    expect(processRecord).toHaveBeenCalledTimes(1);
    expect(processRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        event_id: 'd451063e-b576-4b23-8638-457e68cb6c26',
        name: 'DiZeBra 20150421',
      }),
    );
    fs.unlink(filePath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
  });

  it('should read Kattack parquet files successfully', async () => {
    uploadFileToS3.mockResolvedValueOnce('mockFilePath');

    let filePath = path.resolve(
      __dirname,
      '../../test-files/kattack-test.parquet',
    );
    await processKattackData(filePath);

    const processRecord = jest.fn();
    await readParquet(filePath, processRecord);
    expect(processRecord).toHaveBeenCalledTimes(2);
    expect(processRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        race_id: '79722f12-5f07-43a1-a327-08459673803c',
        name: 'Rox',
      }),
    );
    fs.unlink(filePath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
  });

  it('should read Kwindoo parquet files successfully', async () => {
    uploadFileToS3.mockResolvedValueOnce('mockFilePath');

    let filePath = path.resolve(
      __dirname,
      '../../test-files/kwindoo-test.parquet',
    );
    await processKwindooData(filePath);

    const processRecord = jest.fn();
    await readParquet(filePath, processRecord);
    expect(processRecord).toHaveBeenCalledTimes(3);
    expect(processRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        regatta_id: 'efe26138-6744-40c7-a64e-82f89464589a',
        name: 'I. Flex Fleet Klasszikus Szóló',
      }),
    );
    fs.unlink(filePath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
  });

  it('should read Metasail parquet files successfully', async () => {
    uploadFileToS3.mockResolvedValueOnce('mockFilePath');

    let filePath = path.resolve(
      __dirname,
      '../../test-files/metasail-test.parquet',
    );
    await processMetasailData(filePath);

    const processRecord = jest.fn();
    await readParquet(filePath, processRecord);
    expect(processRecord).toHaveBeenCalledTimes(3);
    expect(processRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        race_id: '1c48bc9b-0933-4e85-ba46-f6ba9cd5b76d',
        name: 'Spi Ouest France 2020 DIAM 24 suite R 7 (race id: 10386)',
      }),
    );
    fs.unlink(filePath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
  });

  it('should read RaceQs parquet files successfully', async () => {
    uploadFileToS3.mockResolvedValueOnce('mockFilePath');

    let filePath = path.resolve(
      __dirname,
      '../../test-files/raceQs-test.parquet',
    );
    await processRaceQsData(filePath);

    const processRecord = jest.fn();
    await readParquet(filePath, processRecord);
    expect(processRecord).toHaveBeenCalledTimes(1);
    expect(processRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        event_id: '846a774c-fefb-4729-b5bf-8746e2e64f4a',
        event_original_id: '62880',
      }),
    );
    fs.unlink(filePath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
  });

  it('should read TackTracker parquet files successfully', async () => {
    uploadFileToS3.mockResolvedValueOnce('mockFilePath');

    let filePath = path.resolve(
      __dirname,
      '../../test-files/tackTracker-test.parquet',
    );
    await processTackTrackerData(filePath);

    const processRecord = jest.fn();
    await readParquet(filePath, processRecord);
    expect(processRecord).toHaveBeenCalledTimes(2);
    expect(processRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        race_id: '8e555bca-e34b-4a3a-a552-34206c108563',
        race_original_id: '8500595',
      }),
    );
    fs.unlink(filePath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
  });

  it('should read Trac Trac parquet files successfully', async () => {
    uploadFileToS3.mockResolvedValueOnce('mockFilePath');

    let filePath = path.resolve(
      __dirname,
      '../../test-files/tractrac-test.parquet',
    );
    await processTracTracData(filePath);

    const processRecord = jest.fn();
    await readParquet(filePath, processRecord);
    expect(processRecord).toHaveBeenCalledTimes(5);
    expect(processRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        race_id: '022e3341-0740-4714-b7e8-5bfcf9651b6f',
        original_race_id: '80b39da0-b465-0131-ba03-10bf48d758ce',
      }),
    );
    fs.unlink(filePath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
  });

  it('should read Yacht Bot parquet files successfully', async () => {
    uploadFileToS3.mockResolvedValueOnce('mockFilePath');

    let filePath = path.resolve(
      __dirname,
      '../../test-files/yachtBot-test.parquet',
    );
    await processYachtBotData(filePath);

    const processRecord = jest.fn();
    await readParquet(filePath, processRecord);
    expect(processRecord).toHaveBeenCalledTimes(2);
    expect(processRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        race_id: '2f052217-bd51-4428-b772-5a0ca8659c77',
        race_original_id: '362',
        name: 'Rolex Day 2 - Race 4',
      }),
    );
    fs.unlink(filePath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
  });

  it('should read Yellowbrick parquet files successfully', async () => {
    uploadFileToS3.mockResolvedValueOnce('mockFilePath');

    let filePath = path.resolve(
      __dirname,
      '../../test-files/yellowbrick-test.parquet',
    );
    await processYellowbrickData(filePath);

    const processRecord = jest.fn();
    await readParquet(filePath, processRecord);
    expect(processRecord).toHaveBeenCalledTimes(3);
    expect(processRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        race_id: 'e64453b5-4e1f-4ffe-9cdd-3fd1cdea49fd',
        tz: 'CEST',
        tz_offset: '7200',
      }),
    );
    fs.unlink(filePath, (err) => {
      if (err) {
        console.log('error deleting: ', err);
      }
    });
  });
});

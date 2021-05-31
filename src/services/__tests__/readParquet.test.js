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
});

describe('Read tracker parquet files', () => {
  beforeAll(async () => {
    await saveBluewaterData(bluewaterData);
    await saveEstelaData(estelaData);
    await saveGeoracingData(georacingData);
    await saveISailData(iSailData);
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
    expect(processRecord).toHaveBeenCalledTimes(1);
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
});

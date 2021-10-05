const db = require('../../../models');
const uploadUtil = require('../../uploadUtil');

const oldGeovoileData = {
  filename: 'non-automatable/normalizeOldGeovoile',
  testData: 'oldGeovoileNormalizeData.json',
  raceTable: 'OldGeovoileRace',
  source: 'OLDGEOVOILE',
};

describe('Normalization test', () => {
  let createMetadataSpy, uploadGeoJsonSpy, trackGeoJsonLookupSpy;
  beforeAll(async () => {
    await db.readyAboutRaceMetadata.sync();
    await db.readyAboutTrackGeoJsonLookup.sync();
    uploadGeoJsonSpy = jest.spyOn(uploadUtil, 'uploadGeoJsonToS3');
    createMetadataSpy = jest.spyOn(db.readyAboutRaceMetadata, 'create');
    trackGeoJsonLookupSpy = jest.spyOn(
      db.readyAboutTrackGeoJsonLookup,
      'create',
    );
  });
  afterAll(async () => {
    await db.readyAboutRaceMetadata.destroy({ truncate: true });
    await db.readyAboutTrackGeoJsonLookup.destroy({ truncate: true });
    await db.sequelize.close();
    jest.restoreAllMocks();
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  it('It should upload to s3', async () => {
    const {
      normalizeRace,
    } = require(`../../normalization/${oldGeovoileData.filename}`);
    const jsonData = require(`../../../test-files/${oldGeovoileData.testData}`);
    const races = jsonData[oldGeovoileData.raceTable];
    await normalizeRace(jsonData);
    expect(createMetadataSpy).toHaveBeenCalledTimes(1);
    expect(trackGeoJsonLookupSpy).toHaveBeenCalledTimes(1);
    races.forEach((race) => {
      expect(uploadGeoJsonSpy).toHaveBeenCalledWith(
        race.id,
        expect.anything(),
        oldGeovoileData.source,
        undefined,
      );
    });
  });
});

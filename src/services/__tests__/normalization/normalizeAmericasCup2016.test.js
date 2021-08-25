const { v4: uuidv4 } = require('uuid');
const db = require('../../../models');
const uploadUtil = require('../../uploadUtil');
const jsonData = require('../../../test-files/americasCup2016/objectsToSave_1.json');
const {
  normalizeRace,
} = require('../../normalization/non-automatable/normalizeAmericascup2016');

describe('When normalize americas cup 2016 is called', () => {
  let createMetadataSpy, uploadGeoJsonSpy, trackGeoJsonLookupSpy;
  beforeAll(async () => {
    await db.readyAboutRaceMetadata.sync();
    await db.readyAboutTrackGeoJsonLookup.sync();
    uploadGeoJsonSpy = jest.spyOn(uploadUtil, 'uploadGeoJsonToS3');
    createMetadataSpy = jest.spyOn(db.readyAboutRaceMetadata, 'create');
    trackGeoJsonLookupSpy = jest.spyOn(db.readyAboutTrackGeoJsonLookup, 'create');
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

  it('should save metadata to readyAboutRaceMetadatas and upload to s3', async () => {
    jsonData.AmericasCupRace.id = uuidv4();
    jsonData.AmericasCupRegatta.id = uuidv4();
    await normalizeRace(jsonData);
    expect(createMetadataSpy).toHaveBeenCalledTimes(1);
    expect(trackGeoJsonLookupSpy).toHaveBeenCalledTimes(1);
    expect(uploadGeoJsonSpy).toHaveBeenCalledWith(
      jsonData.AmericasCupRace.id,
      expect.anything(),
      'AMERICASCUP2016',
      undefined,
    );
  });
});

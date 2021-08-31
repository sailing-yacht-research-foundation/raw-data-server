const { v4: uuidv4 } = require('uuid');
const db = require('../../../models');
const uploadUtil = require('../../uploadUtil');
const {
  normalizeRace,
} = require('../../normalization/non-automatable/normalizeAmericascup');

describe('Normalize americas cup', () => {
  const dirNames = ['americasCup2013', 'americasCup2016'];
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
    jest.clearAllMocks();
  });

  describe.each(dirNames)('When using %s data', (dirName) => {
    it('should save metadata to readyAboutRaceMetadatas and upload to s3', async () => {
      const jsonData = require(`../../../test-files/${dirName}/objectsToSave_1.json`);
      jsonData.AmericasCupRace.id = uuidv4();
      jsonData.AmericasCupRegatta.id = uuidv4();
      await normalizeRace(jsonData);
      expect(createMetadataSpy).toHaveBeenCalledTimes(1);
      expect(trackGeoJsonLookupSpy).toHaveBeenCalledTimes(1);
      expect(uploadGeoJsonSpy).toHaveBeenCalledWith(
        jsonData.AmericasCupRace.id,
        expect.anything(),
        'AMERICASCUP',
        undefined,
      );
    });
  });
});

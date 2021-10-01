const db = require('../../../models');
const uploadUtil = require('../../uploadUtil');
const {
  normalizeRegadata,
} = require('../../normalization/non-automatable/normalizeRegadata');

const regadataData = {
  filename: 'non-automatable/normalizeSap',
  testData: 'regadataNormalizeData.json',
  raceTable: 'regadataRaces',
  source: 'REGADATA',
};

describe('Normalization Regadata Test', () => {
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
  it('It should upload geojson regadata to s3', async () => {
    const jsonData = require(`../../../test-files/${regadataData.testData}`);
    await normalizeRegadata(jsonData);
    expect(createMetadataSpy).toHaveBeenCalledTimes(1);
    expect(trackGeoJsonLookupSpy).toHaveBeenCalledTimes(1);
    expect(uploadGeoJsonSpy).toHaveBeenCalledWith(
      jsonData.regadataRace.id,
      expect.anything(),
      regadataData.source,
      undefined,
    );
  });
});

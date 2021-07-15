const db = require('../../../models');
const { normalizeRace } = require('../../normalization/normalizeBluewater');
const s3Utils = require('../../uploadFileToS3');
const elasticsearch = require('../../../utils/elasticsearch');
const jsonData = require('../../../test-files/bluewater.json');

jest.mock('../../uploadFileToS3', () => ({
  uploadGeoJsonToS3: jest.fn(),
}));
jest.mock('../../../utils/elasticsearch', () => ({
  indexRace: jest.fn(),
}));
jest.setTimeout(60000);

describe('Normalize bluewater data', () => {
  beforeAll(async () => {
    await db.readyAboutRaceMetadata.sync();
  });
  afterAll(async () => {
    await db.readyAboutRaceMetadata.destroy({ truncate: true });
    await db.sequelize.close();
    jest.resetAllMocks();
  });
  it('should save metadata to readyAboutRaceMetadatas', async () => {
    const createMetadata = jest.spyOn(db.readyAboutRaceMetadata, 'create');
    await normalizeRace(jsonData);
    expect(createMetadata).toHaveBeenCalledTimes(1);
    expect(s3Utils.uploadGeoJsonToS3).toHaveBeenCalledTimes(1);
    expect(elasticsearch.indexRace).toHaveBeenCalledTimes(1);
  });
});

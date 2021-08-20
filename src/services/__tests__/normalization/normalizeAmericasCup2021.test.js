const db = require('../../../models');
const uploadUtil = require('../../uploadUtil');

const americasCup2021Data = {
  filename: 'non-automatable/normalizeAmericascup2021',
  testData: 'americasCup2021NormalizeData.json',
  raceTable: 'AmericasCup2021Race',
  source: 'AMERICASCUP2021',
};

describe('Normalization test', () => {
  let uploadGeoJsonSpy;
  beforeAll(async () => {
    await db.readyAboutTrackGeoJsonLookup.sync();
    uploadGeoJsonSpy = jest.spyOn(uploadUtil, 'uploadGeoJsonToS3');
  });
  afterAll(async () => {
    await db.readyAboutTrackGeoJsonLookup.destroy({ truncate: true });
    await db.sequelize.close();
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  it('It should upload to s3', async () => {
    const {
      normalizeRace,
    } = require(`../../normalization/${americasCup2021Data.filename}`);
    const jsonData = require(`../../../test-files/${americasCup2021Data.testData}`);
    const races = jsonData[americasCup2021Data.raceTable];
    await normalizeRace(jsonData);
    races.forEach((race) => {
      expect(uploadGeoJsonSpy).toHaveBeenCalledWith(
        race.id,
        expect.anything(),
        americasCup2021Data.source,
        undefined,
      );
    });
  });
});

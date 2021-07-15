const db = require('../../../models');
// const { normalizeRace } = require('../../normalization/normalizeBluewater');
const s3Utils = require('../../uploadFileToS3');
const elasticsearch = require('../../../utils/elasticsearch');
// const jsonData = require('../../../test-files/bluewater.json');

jest.mock('../../uploadFileToS3', () => ({
  uploadGeoJsonToS3: jest.fn(),
}));
jest.mock('../../../utils/elasticsearch', () => ({
  indexRace: jest.fn(),
}));
jest.setTimeout(60000);

const scraperTestMappings = [
  {
    filename: 'normalizeBluewater',
    testData: 'bluewater.json',
    raceTable: 'BluewaterRace',
    source: 'BLUEWATER',
  },
  {
    filename: 'normalizeEstela',
    testData: 'estela.json',
    raceTable: 'EstelaRace',
    source: 'ESTELA',
  },
];

describe('Normalization test', () => {
  beforeAll(async () => {
    await db.readyAboutRaceMetadata.sync();
  });
  afterAll(async () => {
    await db.readyAboutRaceMetadata.destroy({ truncate: true });
    await db.sequelize.close();
  });
  afterEach(() => {
    jest.resetAllMocks();
  })

  describe.each(scraperTestMappings)(
    'when calling normalizeRace on $filename',
    ({ filename, testData, raceTable, source }) => {
      it('should save metadata to readyAboutRaceMetadatas, call elasticsearch indexRace and upload to s3', async () => {
        const { normalizeRace } = require(`../../normalization/${filename}`);
        const jsonData = require(`../../../test-files/${testData}`);
        const createMetadata = jest.spyOn(db.readyAboutRaceMetadata, 'create');
        const raceId = jsonData[raceTable][0].id;
        await normalizeRace(jsonData);
        expect(createMetadata).toHaveBeenCalledTimes(1);
        expect(elasticsearch.indexRace).toHaveBeenCalledTimes(1);
        expect(s3Utils.uploadGeoJsonToS3).toHaveBeenCalledWith(
          raceId,
          expect.anything(),
          source,
          undefined,
        );
      });
    },
  );
  // it('should save metadata to readyAboutRaceMetadatas', async () => {
  //   const createMetadata = jest.spyOn(db.readyAboutRaceMetadata, 'create');
  //   const raceId = jsonData.BluewaterRace[0].id;
  //   await normalizeRace(jsonData);
  //   expect(createMetadata).toHaveBeenCalledTimes(1);
  //   expect(elasticsearch.indexRace).toHaveBeenCalledTimes(1);
  //   expect(s3Utils.uploadGeoJsonToS3).toHaveBeenCalledWith(
  //     raceId,
  //     expect.anything(),
  //     'BLUEWATER',
  //     undefined
  //   );
  // });
});
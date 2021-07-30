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
  {
    filename: 'normalizeGeoracing',
    testData: 'georacing.json',
    raceTable: 'GeoracingRace',
    source: 'GEORACING',
  },
  {
    filename: 'normalizeISail',
    testData: 'iSail.json',
    raceTable: 'iSailRace',
    source: 'ISAIL',
  },
  {
    filename: 'normalizeKattack',
    testData: 'kattack.json',
    raceTable: 'KattackRace',
    source: 'KATTACK',
  },
  {
    filename: 'normalizeKwindoo',
    testData: 'kwindoo.json',
    raceTable: 'KwindooRace',
    source: 'KWINDOO',
  },
  {
    filename: 'normalizeTackTracker',
    testData: 'tacktracker.json',
    raceTable: 'TackTrackerRace',
    source: 'TACKTRACKER',
  },
  {
    filename: 'normalizeTracTrac',
    testData: 'tractrac.json',
    raceTable: 'TracTracRace',
    source: 'TRACTRAC',
  },
  {
    filename: 'normalizeYellowbrick',
    testData: 'yellowbrick.json',
    raceTable: 'YellowbrickRace',
    source: 'YELLOWBRICK',
  },
  {
    filename: 'normalizeYachtBot',
    testData: 'yachtbot.json',
    raceTable: 'YachtBotRace',
    source: 'YACHTBOT',
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
  });

  describe.each(scraperTestMappings)(
    'when calling normalizeRace on $filename',
    ({ filename, testData, raceTable, source }) => {
      it('should save metadata to readyAboutRaceMetadatas, call elasticsearch indexRace and upload to s3', async () => {
        const { normalizeRace } = require(`../../normalization/${filename}`);
        const jsonData = require(`../../../test-files/${testData}`);
        const createMetadata = jest.spyOn(db.readyAboutRaceMetadata, 'create');
        const races = jsonData[raceTable];
        // const raceId = jsonData[raceTable][0].id;
        await normalizeRace(jsonData);
        expect(createMetadata).toHaveBeenCalledTimes(races.length);
        expect(elasticsearch.indexRace).toHaveBeenCalledTimes(races.length);
        races.forEach((race) => {
          expect(s3Utils.uploadGeoJsonToS3).toHaveBeenCalledWith(
            race.id,
            expect.anything(),
            source,
            undefined,
          );
        });
      });
    },
  );
});

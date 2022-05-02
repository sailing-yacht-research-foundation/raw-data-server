const db = require('../../../models');
const uploadUtil = require('../../../utils/uploadUtil');
const elasticsearch = require('../../../utils/elasticsearch');
const mapScreenshotUtil = require('../../../utils/createMapScreenshot');
const googleAPI = require('../../../syrfDataServices/v1/googleAPI');

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
    filename: 'normalizeMetasail',
    testData: 'metasail.json',
    raceTable: 'MetasailRace',
    source: 'METASAIL',
  },
  {
    filename: 'normalizeRaceQs',
    testData: 'raceQs.json',
    raceTable: 'RaceQsEvent',
    source: 'RACEQS',
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
  {
    filename: 'normalizeSwiftsure',
    testData: 'swiftsure.json',
    raceTable: 'SwiftsureRace',
    source: 'SWIFTSURE',
  },
];

describe('Normalization test', () => {
  let indexRaceSpy, reverseGeoCodeSpy, mapScreenshotSpy, uploadDataSpy;
  beforeAll(async () => {
    await db.readyAboutRaceMetadata.sync();
    await db.readyAboutTrackGeoJsonLookup.sync();
    indexRaceSpy = jest.spyOn(elasticsearch, 'indexRace');
    mapScreenshotSpy = jest.spyOn(mapScreenshotUtil, 'createMapScreenshot');
    reverseGeoCodeSpy = jest.spyOn(googleAPI, 'reverseGeoCode');
    uploadDataSpy = jest.spyOn(uploadUtil, 'uploadDataToS3');
  });
  afterAll(async () => {
    await db.readyAboutRaceMetadata.destroy({ truncate: true });
    await db.readyAboutTrackGeoJsonLookup.destroy({ truncate: true });
    await db.sequelize.close();
  });
  afterEach(() => {
    // Need to replace reset with clear, cause each loop, it's clearing the mock return of geocode from jestSetup
    // So only the first one is success
    jest.clearAllMocks();
  });

  describe.each(scraperTestMappings)(
    'when calling normalizeRace on $filename',
    ({ filename, testData, raceTable }) => {
      it('should save metadata to readyAboutRaceMetadatas, call elasticsearch indexRace and upload to s3', async () => {
        const { normalizeRace } = require(`../../normalization/${filename}`);
        const jsonData = require(`../../../test-files/${testData}`);

        const createMetadata = jest.spyOn(db.readyAboutRaceMetadata, 'create');
        const races = jsonData[raceTable];
        await normalizeRace(jsonData);
        expect(createMetadata).toHaveBeenCalledTimes(races.length);
        expect(indexRaceSpy).toHaveBeenCalledTimes(races.length);
        expect(mapScreenshotSpy).toHaveBeenCalledTimes(races.length); // For uploading the opengraph image
        expect(uploadDataSpy).toHaveBeenCalledTimes(races.length); // For uploading the opengraph image
        expect(reverseGeoCodeSpy).toHaveBeenCalledTimes(races.length);
      });
    },
  );
});

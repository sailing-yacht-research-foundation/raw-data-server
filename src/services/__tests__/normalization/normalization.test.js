const gisUtil = require('../../../utils/gisUtils');
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
    filename: 'normalizeGeovoile',
    testData: 'geovoile.json',
    raceTable: 'geovoileRace',
    source: 'GEOVOILE',
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
    raceTable: 'RaceQsStart',
    source: 'RACEQS',
  },
  {
    filename: 'normalizeTackTracker',
    testData: 'tackTracker.json',
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
    filename: 'normalizeYachtBot',
    testData: 'yachtBot.json',
    raceTable: 'YachtBotRace',
    source: 'YACHTBOT',
  },
  {
    filename: 'normalizeYellowbrick',
    testData: 'yellowbrick.json',
    raceTable: 'YellowbrickRace',
    source: 'YELLOWBRICK',
  },
];

describe('Normalization test', () => {
  let reverseGeoCodeSpy, createRaceSpy;
  beforeAll(async () => {
    reverseGeoCodeSpy = jest.spyOn(googleAPI, 'reverseGeoCode');
    createRaceSpy = jest.spyOn(gisUtil, 'createRace');
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe.each(scraperTestMappings)(
    'when calling normalizeRace on $filename',
    ({ filename, testData, raceTable }) => {
      it('should call createRace from gisUtil', async () => {
        const { normalizeRace } = require(`../../normalization/${filename}`);
        const jsonData = require(`../../../test-files/${testData}`);

        const races = jsonData[raceTable];
        let expectedRaceCount = 1;
        if (races instanceof Array) {
          expectedRaceCount = races.length;
        }
        await normalizeRace(jsonData);
        expect(reverseGeoCodeSpy).toHaveBeenCalledTimes(expectedRaceCount);
        expect(createRaceSpy).toHaveBeenCalledTimes(expectedRaceCount);
      });
    },
  );
});

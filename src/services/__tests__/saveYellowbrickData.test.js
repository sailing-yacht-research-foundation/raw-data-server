const { addDays } = require('date-fns');
const { competitionUnitStatus } = require('../../syrf-schema/enums');
const elasticsearch = require('../../utils/elasticsearch');

const saveYellowbrickData = require('../saveYellowbrickData');
const jsonData = require('../../test-files/yellowbrick.json');
const expectedJsonData = require('../../test-files/expected-data/yellowbrick.json');
const { createAndReturnSpies, testSaveSpies } = require('../../utils/testUtil');

jest.mock('../../syrfDataServices/v1/googleAPI', () => {
  const {
    CalendarEvent,
  } = require('../../test-files/expected-data/yellowbrick.json');
  return {
    reverseGeoCode: jest.fn().mockResolvedValue({
      countryName: CalendarEvent.country,
      cityName: CalendarEvent.city,
    }),
  };
});
describe('Storing yellowbrick data to DB', () => {
  let spies;

  beforeAll(async () => {
    spies = createAndReturnSpies();
  });
  afterAll(async () => {
    jest.restoreAllMocks();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not save anything when json data is empty', async () => {
    await saveYellowbrickData();
    expect(spies.calendarEventUpsertSpy).toHaveBeenCalledTimes(0);
    expect(spies.competitionUnitUpsertSpy).toHaveBeenCalledTimes(0);
  });

  it('should save data correctly', async () => {
    await saveYellowbrickData(jsonData);
    const race = jsonData.YellowbrickRace[0];
    testSaveSpies(spies, race, expectedJsonData, jsonData.YellowbrickEvent[0]);
    expect(spies.vesselGetByVesselIdAndSourceSpy).toHaveBeenCalledTimes(1);
  });

  describe('when saving an unfinished race', () => {
    let futureDate, elasticSearchIndexSpy;
    beforeEach(() => {
      const now = new Date();
      futureDate = addDays(now, 1);
      elasticSearchIndexSpy = jest.spyOn(elasticsearch, 'indexRace');
    });
    it('should only call elastic search to index and do not save in db when start time is in the future', async () => {
      const unfinishedJsonData = JSON.parse(JSON.stringify(jsonData));
      unfinishedJsonData.YellowbrickRace[0].start = futureDate.getTime() / 1000;
      const expectedElasticsearchBody = JSON.parse(
        JSON.stringify(expectedJsonData.ElasticSearchBodyUnfinishedRace),
      );
      expectedElasticsearchBody.start_year = futureDate.getUTCFullYear();
      expectedElasticsearchBody.start_month = futureDate.getUTCMonth() + 1;
      expectedElasticsearchBody.start_day = futureDate.getUTCDate();
      expectedElasticsearchBody.approx_start_time_ms = futureDate.getTime();
      expectedElasticsearchBody.status = competitionUnitStatus.SCHEDULED;

      await saveYellowbrickData(unfinishedJsonData);

      expect(spies.calendarEventUpsertSpy).toHaveBeenCalledTimes(0);
      expect(spies.competitionUnitUpsertSpy).toHaveBeenCalledTimes(0);
      expect(elasticSearchIndexSpy).toHaveBeenCalledWith(
        expectedElasticsearchBody.id,
        expect.objectContaining(expectedElasticsearchBody),
      );
    });

    it('should only call elastic search to index and do not save in db when start time has passed but end time is in the future', async () => {
      const unfinishedJsonData = JSON.parse(JSON.stringify(jsonData));
      unfinishedJsonData.YellowbrickRace[0].stop = futureDate.getTime() / 1000;
      const expectedElasticsearchBody = JSON.parse(
        JSON.stringify(expectedJsonData.ElasticSearchBodyUnfinishedRace),
      );
      expectedElasticsearchBody.approx_end_time_ms = futureDate.getTime();
      expectedElasticsearchBody.status = competitionUnitStatus.ONGOING;

      await saveYellowbrickData(unfinishedJsonData);

      expect(spies.calendarEventUpsertSpy).toHaveBeenCalledTimes(0);
      expect(spies.competitionUnitUpsertSpy).toHaveBeenCalledTimes(0);
      expect(elasticSearchIndexSpy).toHaveBeenCalledWith(
        expectedElasticsearchBody.id,
        expect.objectContaining(expectedElasticsearchBody),
      );
    });
  });
});

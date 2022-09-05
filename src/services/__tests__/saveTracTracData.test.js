const { format, addDays } = require('date-fns');
const { utcToZonedTime } = require('date-fns-tz');
const { competitionUnitStatus } = require('../../syrf-schema/enums');
const elasticsearch = require('../../utils/elasticsearch');

const saveTracTracData = require('../saveTracTracData');
const jsonData = require('../../test-files/tractrac.json');
const expectedJsonData = require('../../test-files/expected-data/tractrac.json');
const { createAndReturnSpies, testSaveSpies } = require('../../utils/testUtil');

jest.mock('../../syrfDataServices/v1/googleAPI', () => {
  const {
    CalendarEvent,
  } = require('../../test-files/expected-data/tractrac.json');
  return {
    reverseGeoCode: jest.fn().mockResolvedValue({
      countryName: CalendarEvent.country,
      cityName: CalendarEvent.city,
    }),
  };
});
describe('Storing tractrac data to DB', () => {
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
    await saveTracTracData();
    expect(spies.calendarEventUpsertSpy).toHaveBeenCalledTimes(0);
    expect(spies.competitionUnitUpsertSpy).toHaveBeenCalledTimes(0);
  });

  it('should save data correctly', async () => {
    await saveTracTracData(jsonData);

    const race = jsonData.TracTracRace[0];
    testSaveSpies(spies, race, expectedJsonData, jsonData.TracTracEvent[0]);
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
      const race = unfinishedJsonData.TracTracRace[0];
      race.tracking_start = format(
        utcToZonedTime(futureDate, 'Etc/UTC'),
        'yyyy-MM-dd HH:mm:ss',
      );
      race.race_start = race.tracking_start;
      const expectedElasticsearchBody = JSON.parse(
        JSON.stringify(expectedJsonData.ElasticSearchBodyUnfinishedRace),
      );
      expectedElasticsearchBody.start_year = futureDate.getUTCFullYear();
      expectedElasticsearchBody.start_month = futureDate.getUTCMonth() + 1;
      expectedElasticsearchBody.start_day = futureDate.getUTCDate();
      const futureTime = futureDate.getTime();
      expectedElasticsearchBody.approx_start_time_ms =
        Math.floor(futureTime / 1000) * 1000; // Round to seconds as the tracking_start format is in seconds only
      expectedElasticsearchBody.status = competitionUnitStatus.SCHEDULED;

      await saveTracTracData(unfinishedJsonData);

      expect(spies.calendarEventUpsertSpy).toHaveBeenCalledTimes(0);
      expect(spies.competitionUnitUpsertSpy).toHaveBeenCalledTimes(0);
      expect(elasticSearchIndexSpy).toHaveBeenCalledWith(
        expectedElasticsearchBody.id,
        expect.objectContaining(expectedElasticsearchBody),
      );
    });

    it('should only call elastic search to index and do not save in db when start time has passed but end time is in the future', async () => {
      const unfinishedJsonData = JSON.parse(JSON.stringify(jsonData));
      unfinishedJsonData.TracTracRace[0].tracking_stop = format(
        utcToZonedTime(futureDate, 'Etc/UTC'),
        'yyyy-MM-dd HH:mm:ss',
      );
      const expectedElasticsearchBody = JSON.parse(
        JSON.stringify(expectedJsonData.ElasticSearchBodyUnfinishedRace),
      );
      const futureTime = futureDate.getTime();
      expectedElasticsearchBody.approx_end_time_ms =
        Math.floor(futureTime / 1000) * 1000; // Round to seconds as the tracking_stopformat is in seconds only
      expectedElasticsearchBody.status = competitionUnitStatus.ONGOING;

      await saveTracTracData(unfinishedJsonData);

      expect(spies.calendarEventUpsertSpy).toHaveBeenCalledTimes(0);
      expect(spies.competitionUnitUpsertSpy).toHaveBeenCalledTimes(0);
      expect(elasticSearchIndexSpy).toHaveBeenCalledWith(
        expectedElasticsearchBody.id,
        expect.objectContaining(expectedElasticsearchBody),
      );
    });
  });
});

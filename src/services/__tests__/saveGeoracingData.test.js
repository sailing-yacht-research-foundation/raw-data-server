const { format, addDays } = require('date-fns');
const { competitionUnitStatus } = require('../../syrf-schema/enums');
const elasticsearch = require('../../utils/elasticsearch');

const saveGeoracingData = require('../saveGeoracingData');
const jsonData = require('../../test-files/georacing.json');
const expectedJsonData = require('../../test-files/expected-data/georacing.json');
const { createAndReturnSpies, testSaveSpies } = require('../../utils/testUtil');

jest.mock('../../syrfDataServices/v1/googleAPI', () => {
  const {
    CalendarEvent,
  } = require('../../test-files/expected-data/georacing.json');
  return {
    reverseGeoCode: jest.fn().mockResolvedValue({
      countryName: CalendarEvent.country,
      cityName: CalendarEvent.city,
    }),
  };
});
describe('Storing georacing data to DB', () => {
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
    await saveGeoracingData();
    expect(spies.calendarEventUpsertSpy).toHaveBeenCalledTimes(0);
    expect(spies.competitionUnitUpsertSpy).toHaveBeenCalledTimes(0);
  });

  it('should save data correctly', async () => {
    await saveGeoracingData(jsonData);

    const race = jsonData.GeoracingRace[0];
    testSaveSpies(spies, race, expectedJsonData, jsonData.GeoracingEvent[0]);
    expect(spies.vesselGetByVesselIdAndSourceSpy).toHaveBeenCalledTimes(0); // this will only be called if reuse boat is true
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
      unfinishedJsonData.GeoracingRace[0].start_time = format(
        futureDate,
        "yyyy-MM-dd'T'HH:mm:ss.SSS",
      );
      const expectedElasticsearchBody = JSON.parse(
        JSON.stringify(expectedJsonData.ElasticSearchBodyUnfinishedRace),
      );
      expectedElasticsearchBody.start_year = futureDate.getUTCFullYear();
      expectedElasticsearchBody.start_month = futureDate.getUTCMonth() + 1;
      expectedElasticsearchBody.start_day = futureDate.getUTCDate();
      expectedElasticsearchBody.approx_start_time_ms = futureDate.getTime();
      expectedElasticsearchBody.status = competitionUnitStatus.SCHEDULED;

      await saveGeoracingData(unfinishedJsonData);

      expect(spies.calendarEventUpsertSpy).toHaveBeenCalledTimes(0);
      expect(spies.competitionUnitUpsertSpy).toHaveBeenCalledTimes(0);
      expect(elasticSearchIndexSpy).toHaveBeenCalledWith(
        expectedElasticsearchBody.id,
        expect.objectContaining(expectedElasticsearchBody),
      );
    });

    it('should only call elastic search to index and do not save in db when start time has passed but end time is in the future', async () => {
      const unfinishedJsonData = JSON.parse(JSON.stringify(jsonData));
      unfinishedJsonData.GeoracingRace[0].end_time = format(
        futureDate,
        "yyyy-MM-dd'T'HH:mm:ss.SSS",
      );
      const expectedElasticsearchBody = JSON.parse(
        JSON.stringify(expectedJsonData.ElasticSearchBodyUnfinishedRace),
      );
      expectedElasticsearchBody.approx_end_time_ms = futureDate.getTime();
      expectedElasticsearchBody.status = competitionUnitStatus.ONGOING;

      await saveGeoracingData(unfinishedJsonData);

      expect(spies.calendarEventUpsertSpy).toHaveBeenCalledTimes(0);
      expect(spies.competitionUnitUpsertSpy).toHaveBeenCalledTimes(0);
      expect(elasticSearchIndexSpy).toHaveBeenCalledWith(
        expectedElasticsearchBody.id,
        expect.objectContaining(expectedElasticsearchBody),
      );
    });
  });
});

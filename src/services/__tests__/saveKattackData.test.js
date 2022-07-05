const { addDays } = require('date-fns');
const calendarEventDAL = require('../../syrf-schema/dataAccess/v1/calendarEvent');
const vesselParticipantGroupDAL = require('../../syrf-schema/dataAccess/v1/vesselParticipantGroup');
const vesselDAL = require('../../syrf-schema/dataAccess/v1/vessel');
const vesselParticipantDAL = require('../../syrf-schema/dataAccess/v1/vesselParticipant');
const participantDAL = require('../../syrf-schema/dataAccess/v1/participant');
const markTrackerDAL = require('../../syrf-schema/dataAccess/v1/markTracker');
const courseDAL = require('../../syrf-schema/dataAccess/v1/course');
const competitionUnitDAL = require('../../syrf-schema/dataAccess/v1/competitionUnit');
const vesselParticipantEventDAL = require('../../syrf-schema/dataAccess/v1/vesselParticipantEvent');
const scrapedSuccessfulUrlDAL = require('../../syrf-schema/dataAccess/v1/scrapedSuccessfulUrl');
const utils = require('../../syrf-schema/utils/utils');
const { competitionUnitStatus } = require('../../syrf-schema/enums');
const elasticsearch = require('../../utils/elasticsearch');

const { SOURCE } = require('../../constants');
const saveKattackData = require('../saveKattackData');
const jsonData = require('../../test-files/kattack.json');
const expectedJsonData = require('../../test-files/expected-data/kattack.json');

jest.mock('../../syrfDataServices/v1/googleAPI', () => {
  const {
    CalendarEvent,
  } = require('../../test-files/expected-data/kattack.json');
  return {
    reverseGeoCode: jest.fn().mockResolvedValue({
      countryName: CalendarEvent.country,
      cityName: CalendarEvent.city,
    }),
  };
});
describe('Storing kattack data to DB', () => {
  let calendarEventUpsertSpy,
    vesselParticipantGroupUpsertSpy,
    vesselGetByVesselIdAndSourceSpy,
    vesselBulkCreateSpy,
    vesselParticipantBulkCreateSpy,
    vesselParticipantAddParticipantSpy,
    participantBulkCreateSpy,
    markTrackerUpsertSpy,
    courseUpsertSpy,
    courseBulkInsertPointsSpy,
    competitionUnitUpsertSpy,
    vesselParticipantEventBulkCreateSpy,
    scrapedSuccessfulUrlCreateSpy,
    commitSpy,
    elasticSearchUpdateSpy;

  beforeAll(async () => {
    calendarEventUpsertSpy = jest.spyOn(calendarEventDAL, 'upsert');
    vesselParticipantGroupUpsertSpy = jest.spyOn(
      vesselParticipantGroupDAL,
      'upsert',
    );
    vesselGetByVesselIdAndSourceSpy = jest.spyOn(
      vesselDAL,
      'getByVesselIdAndSource',
    );
    vesselBulkCreateSpy = jest.spyOn(vesselDAL, 'bulkCreate');
    vesselParticipantBulkCreateSpy = jest.spyOn(
      vesselParticipantDAL,
      'bulkCreate',
    );
    vesselParticipantAddParticipantSpy = jest.spyOn(
      vesselParticipantDAL,
      'addParticipant',
    );
    participantBulkCreateSpy = jest.spyOn(participantDAL, 'bulkCreate');
    markTrackerUpsertSpy = jest.spyOn(markTrackerDAL, 'upsert');
    courseUpsertSpy = jest.spyOn(courseDAL, 'upsert');
    courseBulkInsertPointsSpy = jest.spyOn(courseDAL, 'bulkInsertPoints');
    competitionUnitUpsertSpy = jest.spyOn(competitionUnitDAL, 'upsert');
    vesselParticipantEventBulkCreateSpy = jest.spyOn(
      vesselParticipantEventDAL,
      'bulkCreate',
    );
    scrapedSuccessfulUrlCreateSpy = jest.spyOn(
      scrapedSuccessfulUrlDAL,
      'create',
    );
    commitSpy = jest.fn().mockResolvedValue();
    jest
      .spyOn(utils, 'createTransaction')
      .mockResolvedValue({ commit: commitSpy, rollback: jest.fn() });
    elasticSearchUpdateSpy = jest.spyOn(
      elasticsearch,
      'updateEventAndIndexRaces',
    );
  });
  afterAll(async () => {
    jest.restoreAllMocks();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not save anything when json data is empty', async () => {
    await saveKattackData();
    expect(calendarEventUpsertSpy).toHaveBeenCalledTimes(0);
    expect(competitionUnitUpsertSpy).toHaveBeenCalledTimes(0);
  });

  it('should save data correctly', async () => {
    await saveKattackData(jsonData);
    const race = jsonData.KattackRace[0];
    expect(calendarEventUpsertSpy).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining(expectedJsonData.CalendarEvent),
      expect.anything(),
    );
    expect(vesselParticipantGroupUpsertSpy).toHaveBeenCalledTimes(1);
    expect(vesselGetByVesselIdAndSourceSpy).toHaveBeenCalledTimes(1);
    expect(vesselBulkCreateSpy).toHaveBeenCalledWith(
      expectedJsonData.Vessels,
      expect.anything(),
    );
    expect(vesselParticipantBulkCreateSpy).toHaveBeenCalledWith(
      expectedJsonData.VesselParticipants,
      expect.anything(),
    );
    expect(vesselParticipantAddParticipantSpy).toHaveBeenCalledTimes(0);
    expect(participantBulkCreateSpy).toHaveBeenCalledTimes(0);
    expectedJsonData.Participants?.forEach((p) => {
      expect(participantBulkCreateSpy).toHaveBeenCalledWith(
        p,
        expect.anything(),
      );
    });
    expect(markTrackerUpsertSpy).toHaveBeenCalledTimes(0);
    expect(courseBulkInsertPointsSpy).toHaveBeenCalledTimes(1);
    expect(courseUpsertSpy).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        ...expectedJsonData.Course,
        courseSequencedGeometries:
          expectedJsonData.Course.courseSequencedGeometries.map((g) =>
            expect.objectContaining(g),
          ),
      }),
      expect.anything(),
    );
    expect(competitionUnitUpsertSpy).toHaveBeenCalledWith(
      race.id,
      expect.objectContaining(expectedJsonData.CompetitionUnit),
      expect.anything(),
    );
    expect(vesselParticipantEventBulkCreateSpy).toHaveBeenCalledTimes(0);
    expect(scrapedSuccessfulUrlCreateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: race.url,
        originalId: race.original_id,
        source: SOURCE.KATTACK,
      }),
      expect.anything(),
    );
    expect(commitSpy).toHaveBeenCalled();
    expect(elasticSearchUpdateSpy).toHaveBeenCalledWith(
      [expect.objectContaining(expectedJsonData.ElasticSearchBody)],
      [expect.objectContaining(expectedJsonData.CompetitionUnit)],
    );
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
      unfinishedJsonData.KattackRace[0].race_start_time_utc =
        futureDate.getTime();
      const expectedElasticsearchBody = JSON.parse(
        JSON.stringify(expectedJsonData.ElasticSearchBodyUnfinishedRace),
      );
      expectedElasticsearchBody.start_year = futureDate.getUTCFullYear();
      expectedElasticsearchBody.start_month = futureDate.getUTCMonth() + 1;
      expectedElasticsearchBody.start_day = futureDate.getUTCDate();
      expectedElasticsearchBody.approx_start_time_ms = futureDate.getTime();
      expectedElasticsearchBody.approx_end_time_ms =
        unfinishedJsonData.KattackRace[0].race_start_time_utc +
        unfinishedJsonData.KattackRace[0].race_length_sec * 1000;
      expectedElasticsearchBody.status = competitionUnitStatus.SCHEDULED;

      await saveKattackData(unfinishedJsonData);

      expect(calendarEventUpsertSpy).toHaveBeenCalledTimes(0);
      expect(competitionUnitUpsertSpy).toHaveBeenCalledTimes(0);
      expect(elasticSearchIndexSpy).toHaveBeenCalledWith(
        expectedElasticsearchBody.id,
        expect.objectContaining(expectedElasticsearchBody),
      );
    });

    it('should only call elastic search to index and do not save in db when start time has passed but end time is in the future', async () => {
      const unfinishedJsonData = JSON.parse(JSON.stringify(jsonData));
      unfinishedJsonData.KattackRace[0].race_length_sec =
        (futureDate.getTime() -
          unfinishedJsonData.KattackRace[0].race_start_time_utc) /
        1000;
      const expectedElasticsearchBody = JSON.parse(
        JSON.stringify(expectedJsonData.ElasticSearchBodyUnfinishedRace),
      );
      expectedElasticsearchBody.approx_end_time_ms =
        unfinishedJsonData.KattackRace[0].race_start_time_utc +
        unfinishedJsonData.KattackRace[0].race_length_sec * 1000;
      expectedElasticsearchBody.status = competitionUnitStatus.ONGOING;

      await saveKattackData(unfinishedJsonData);

      expect(calendarEventUpsertSpy).toHaveBeenCalledTimes(0);
      expect(competitionUnitUpsertSpy).toHaveBeenCalledTimes(0);
      expect(elasticSearchIndexSpy).toHaveBeenCalledWith(
        expectedElasticsearchBody.id,
        expect.objectContaining(expectedElasticsearchBody),
      );
    });
  });
});

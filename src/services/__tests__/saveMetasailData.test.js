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
const saveMetasailData = require('../saveMetasailData');
const jsonData = require('../../test-files/metasail.json');
const expectedJsonData = require('../../test-files/expected-data/metasail.json');

jest.mock('../../syrfDataServices/v1/googleAPI', () => {
  const {
    CalendarEvent,
  } = require('../../test-files/expected-data/metasail.json');
  return {
    reverseGeoCode: jest.fn().mockResolvedValue({
      countryName: CalendarEvent.country,
      cityName: CalendarEvent.city,
    }),
  };
});
describe('Storing metasail data to DB', () => {
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
    await saveMetasailData();
    expect(calendarEventUpsertSpy).toHaveBeenCalledTimes(0);
    expect(competitionUnitUpsertSpy).toHaveBeenCalledTimes(0);
  });

  it('should save data correctly', async () => {
    await saveMetasailData(jsonData);

    const race = jsonData.MetasailRace[0];
    expect(calendarEventUpsertSpy).toHaveBeenCalledWith(
      jsonData.MetasailEvent[0].id,
      expect.objectContaining(expectedJsonData.CalendarEvent),
      expect.anything(),
    );
    expect(vesselParticipantGroupUpsertSpy).toHaveBeenCalledTimes(1);
    expect(vesselGetByVesselIdAndSourceSpy).toHaveBeenCalledTimes(1); // this will only be called if reuse boat is true
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
    expectedJsonData.Participants.forEach((p) => {
      expect(participantBulkCreateSpy).toHaveBeenCalledWith(
        p,
        expect.anything(),
      );
    });
    expect(markTrackerUpsertSpy).toHaveBeenCalledTimes(
      expectedJsonData.MarkTrackers?.length,
    );
    expectedJsonData.MarkTrackers?.forEach((m) => {
      expect(markTrackerUpsertSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining(m),
        expect.anything(),
      );
    });
    expect(courseBulkInsertPointsSpy).toHaveBeenCalledTimes(1);
    expect(courseUpsertSpy).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        ...expectedJsonData.Course,
        courseSequencedGeometries:
          expectedJsonData.Course.courseSequencedGeometries.map((g) =>
            expect.objectContaining({
              ...g,
              points: g.points.map((p) => expect.objectContaining(p)),
            }),
          ),
      }),
      expect.anything(),
    );
    expect(competitionUnitUpsertSpy).toHaveBeenCalledWith(
      race.id,
      expect.objectContaining(expectedJsonData.CompetitionUnit),
      expect.anything(),
    );
    expect(vesselParticipantEventBulkCreateSpy).toHaveBeenCalledTimes(
      expectedJsonData.VesselParticipantEvents?.length ? 1 : 0,
    );
    expect(scrapedSuccessfulUrlCreateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: race.url,
        originalId: race.original_id,
        source: SOURCE.METASAIL,
      }),
      expect.anything(),
    );
    expect(commitSpy).toHaveBeenCalled();
    expect(elasticSearchUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining(expectedJsonData.ElasticSearchBodies),
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
      unfinishedJsonData.MetasailRace[0].start = futureDate.getTime();
      const expectedElasticsearchBody = JSON.parse(
        JSON.stringify(expectedJsonData.ElasticSearchBodyUnfinishedRace),
      );
      expectedElasticsearchBody.start_year = futureDate.getUTCFullYear();
      expectedElasticsearchBody.start_month = futureDate.getUTCMonth() + 1;
      expectedElasticsearchBody.start_day = futureDate.getUTCDate();
      expectedElasticsearchBody.approx_start_time_ms = futureDate.getTime();
      expectedElasticsearchBody.status = competitionUnitStatus.SCHEDULED;

      await saveMetasailData(unfinishedJsonData);

      expect(calendarEventUpsertSpy).toHaveBeenCalledTimes(0);
      expect(competitionUnitUpsertSpy).toHaveBeenCalledTimes(0);
      expect(elasticSearchIndexSpy).toHaveBeenCalledWith(
        expectedElasticsearchBody.id,
        expect.objectContaining(expectedElasticsearchBody),
      );
    });

    it('should only call elastic search to index and do not save in db when start time has passed but end time is in the future', async () => {
      const unfinishedJsonData = JSON.parse(JSON.stringify(jsonData));
      unfinishedJsonData.MetasailRace[0].stop = futureDate.getTime();
      const expectedElasticsearchBody = JSON.parse(
        JSON.stringify(expectedJsonData.ElasticSearchBodyUnfinishedRace),
      );
      expectedElasticsearchBody.approx_end_time_ms = futureDate.getTime();
      expectedElasticsearchBody.status = competitionUnitStatus.ONGOING;

      await saveMetasailData(unfinishedJsonData);

      expect(calendarEventUpsertSpy).toHaveBeenCalledTimes(0);
      expect(competitionUnitUpsertSpy).toHaveBeenCalledTimes(0);
      expect(elasticSearchIndexSpy).toHaveBeenCalledWith(
        expectedElasticsearchBody.id,
        expect.objectContaining(expectedElasticsearchBody),
      );
    });
  });
});

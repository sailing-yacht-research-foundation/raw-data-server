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
const syrfFailedUrlDAL = require('../../syrf-schema/dataAccess/v1/scrapedFailedUrl');
const utils = require('../../syrf-schema/utils/utils');
const { competitionUnitStatus } = require('../../syrf-schema/enums');
const elasticsearch = require('../../utils/elasticsearch');
const { RACEQS } = require('../../constants');

const { SOURCE } = require('../../constants');
const saveRaceQsData = require('../saveRaceQsData');
const jsonData = require('../../test-files/raceQs.json');
const expectedJsonData = require('../../test-files/expected-data/raceQs.json');

describe('Storing raceqs data to DB', () => {
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
    syrfFailedUrlDALCreateSpy,
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
    syrfFailedUrlDALCreateSpy = jest.spyOn(syrfFailedUrlDAL, 'create');
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
    await saveRaceQsData();
    expect(calendarEventUpsertSpy).toHaveBeenCalledTimes(0);
    expect(competitionUnitUpsertSpy).toHaveBeenCalledTimes(0);
  });

  it('should not save and not call elastic search index if boat positions are not within the start time range', async () => {
    const invalidRaceJsonData = JSON.parse(JSON.stringify(jsonData));
    // Set all the boats' start time after all the RaceQsStart.from which makes it invalid
    invalidRaceJsonData.RaceQsParticipant.forEach((p) => {
      p.start = '2014-08-29T17:13:21.542-04:00';
    });

    await saveRaceQsData(invalidRaceJsonData);

    expect(calendarEventUpsertSpy).toHaveBeenCalledTimes(0);
    expect(competitionUnitUpsertSpy).toHaveBeenCalledTimes(0);
    expect(elasticSearchUpdateSpy).toHaveBeenCalledTimes(0);
    expect(syrfFailedUrlDALCreateSpy).toHaveBeenCalledTimes(1);
    invalidRaceJsonData.RaceQsEvent.forEach((r) => {
      expect(syrfFailedUrlDALCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          source: SOURCE.RACEQS,
          url: r.url,
        }),
      );
    });
  });

  it('should save data correctly', async () => {
    await saveRaceQsData(jsonData);

    expect(calendarEventUpsertSpy).toHaveBeenCalledTimes(
      expectedJsonData.CompetitionUnits.length,
    );
    expect(calendarEventUpsertSpy).toHaveBeenCalledWith(
      jsonData.RaceQsRegatta[0].id,
      expect.objectContaining(expectedJsonData.CalendarEvent),
      expect.anything(),
    );
    expect(vesselParticipantGroupUpsertSpy).toHaveBeenCalledTimes(
      expectedJsonData.CompetitionUnits.length,
    );
    expect(vesselGetByVesselIdAndSourceSpy).toHaveBeenCalledTimes(
      expectedJsonData.Vessels.length,
    ); // this will only be called if reuse boat is true
    expectedJsonData.Vessels.forEach((vesselList) => {
      expect(vesselBulkCreateSpy).toHaveBeenCalledWith(
        vesselList,
        expect.anything(),
      );
    });
    expectedJsonData.VesselParticipants.forEach((vpList) => {
      expect(vesselParticipantBulkCreateSpy).toHaveBeenCalledWith(
        vpList,
        expect.anything(),
      );
    });
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
    expect(courseBulkInsertPointsSpy).toHaveBeenCalledTimes(
      expectedJsonData.Courses.length,
    );
    expectedJsonData.Courses.forEach((expectedCourse) => {
      expect(courseUpsertSpy).toHaveBeenCalledWith(
        null,
        expect.objectContaining({
          ...expectedCourse,
          courseSequencedGeometries:
            expectedCourse.courseSequencedGeometries.map((g) =>
              expect.objectContaining({
                ...g,
                points: g.points.map((p) => expect.objectContaining(p)),
              }),
            ),
        }),
        expect.anything(),
      );
    });
    expectedJsonData.CompetitionUnits.forEach((expectedCompetition, index) => {
      const race = jsonData.RaceQsEvent[0];
      const start = jsonData.RaceQsStart[index];
      expect(competitionUnitUpsertSpy).toHaveBeenCalledWith(
        start.id,
        expect.objectContaining(expectedCompetition),
        expect.anything(),
      );
      expect(scrapedSuccessfulUrlCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          url: race.url,
          originalId: `${RACEQS.START_PREFIX}${start.event_original_id}-${start.original_id}`,
          source: SOURCE.RACEQS,
        }),
        expect.anything(),
      );
    });
    expect(vesselParticipantEventBulkCreateSpy).toHaveBeenCalledTimes(0);
    expect(commitSpy).toHaveBeenCalled();
    expect(elasticSearchUpdateSpy).toHaveBeenCalledWith(
      expectedJsonData.ElasticSearchBodies.map((es) =>
        expect.objectContaining(es),
      ),
      expectedJsonData.CompetitionUnits.map((cu) =>
        expect.objectContaining(cu),
      ),
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
      unfinishedJsonData.RaceQsEvent[0].from = futureDate.getTime();
      const expectedElasticsearchBody = JSON.parse(
        JSON.stringify(expectedJsonData.ElasticSearchBodyUnfinishedRace),
      );
      expectedElasticsearchBody.start_year = futureDate.getFullYear();
      expectedElasticsearchBody.start_month = futureDate.getMonth() + 1;
      expectedElasticsearchBody.start_day = futureDate.getDate();
      expectedElasticsearchBody.approx_start_time_ms = futureDate.getTime();
      expectedElasticsearchBody.status = competitionUnitStatus.SCHEDULED;

      await saveRaceQsData(unfinishedJsonData);

      expect(calendarEventUpsertSpy).toHaveBeenCalledTimes(0);
      expect(competitionUnitUpsertSpy).toHaveBeenCalledTimes(0);
      expect(elasticSearchIndexSpy).toHaveBeenCalledWith(
        expectedElasticsearchBody.id,
        expect.objectContaining(expectedElasticsearchBody),
      );
    });

    it('should only call elastic search to index and do not save in db when start time has passed but end time is in the future', async () => {
      const unfinishedJsonData = JSON.parse(JSON.stringify(jsonData));
      unfinishedJsonData.RaceQsEvent[0].till = futureDate.getTime();
      const expectedElasticsearchBody = JSON.parse(
        JSON.stringify(expectedJsonData.ElasticSearchBodyUnfinishedRace),
      );
      expectedElasticsearchBody.approx_end_time_ms = futureDate.getTime();
      expectedElasticsearchBody.status = competitionUnitStatus.ONGOING;

      await saveRaceQsData(unfinishedJsonData);

      expect(calendarEventUpsertSpy).toHaveBeenCalledTimes(0);
      expect(competitionUnitUpsertSpy).toHaveBeenCalledTimes(0);
      expect(elasticSearchIndexSpy).toHaveBeenCalledWith(
        expectedElasticsearchBody.id,
        expect.objectContaining(expectedElasticsearchBody),
      );
    });
  });
});

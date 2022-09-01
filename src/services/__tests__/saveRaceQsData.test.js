const { addDays } = require('date-fns');
const { competitionUnitStatus } = require('../../syrf-schema/enums');
const elasticsearch = require('../../utils/elasticsearch');
const { SOURCE, RACEQS } = require('../../constants');

const saveRaceQsData = require('../saveRaceQsData');
const jsonData = require('../../test-files/raceQs.json');
const expectedJsonData = require('../../test-files/expected-data/raceQs.json');
const { createAndReturnSpies } = require('../../utils/testUtil');
const ogJob = require('../../jobs/openGraph');

jest.mock('../../syrfDataServices/v1/googleAPI', () => {
  const {
    CalendarEvent,
  } = require('../../test-files/expected-data/raceQs.json');
  return {
    reverseGeoCode: jest.fn().mockReturnValue({
      countryName: CalendarEvent.country,
      cityName: CalendarEvent.city,
    }),
  };
});
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
    ({
      calendarEventUpsertSpy,
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
      elasticSearchUpdateSpy,
    } = createAndReturnSpies());
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
      expect(ogJob.addCompetitionUnit).toHaveBeenCalledWith(
        {
          idList: [start.id],
          position: expectedCompetition.approximateStartLocation.coordinates,
        },
        { jobId: start.id },
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
    expect(ogJob.addEvent).toHaveBeenCalledWith(
      {
        id: expect.any(String),
        position: expectedJsonData.CalendarEvent.location.coordinates,
      },
      { jobId: expect.any(String) },
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
      expectedElasticsearchBody.start_year = futureDate.getUTCFullYear();
      expectedElasticsearchBody.start_month = futureDate.getUTCMonth() + 1;
      expectedElasticsearchBody.start_day = futureDate.getUTCDate();
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

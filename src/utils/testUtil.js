const ogJob = require('../jobs/openGraph');
const calendarEventDAL = require('../syrf-schema/dataAccess/v1/calendarEvent');
const vesselParticipantGroupDAL = require('../syrf-schema/dataAccess/v1/vesselParticipantGroup');
const vesselDAL = require('../syrf-schema/dataAccess/v1/vessel');
const vesselParticipantDAL = require('../syrf-schema/dataAccess/v1/vesselParticipant');
const participantDAL = require('../syrf-schema/dataAccess/v1/participant');
const markTrackerDAL = require('../syrf-schema/dataAccess/v1/markTracker');
const courseDAL = require('../syrf-schema/dataAccess/v1/course');
const competitionUnitDAL = require('../syrf-schema/dataAccess/v1/competitionUnit');
const vesselParticipantEventDAL = require('../syrf-schema/dataAccess/v1/vesselParticipantEvent');
const scrapedSuccessfulUrlDAL = require('../syrf-schema/dataAccess/v1/scrapedSuccessfulUrl');
const syrfFailedUrlDAL = require('../syrf-schema/dataAccess/v1/scrapedFailedUrl');
const utils = require('../syrf-schema/utils/utils');
const elasticsearch = require('../utils/elasticsearch');

/**
 * This function is used by all scheduled scraper test except RACEQS since raceQs has different implementation
 *
 */
exports.testSaveSpies = (
  {
    calendarEventUpsertSpy,
    vesselParticipantGroupUpsertSpy,
    vesselBulkCreateSpy,
    vesselParticipantBulkCreateSpy,
    vesselParticipantAddParticipantSpy,
    participantBulkCreateSpy,
    markTrackerUpsertSpy,
    courseBulkInsertPointsSpy,
    courseUpsertSpy,
    competitionUnitUpsertSpy,
    vesselParticipantEventBulkCreateSpy,
    scrapedSuccessfulUrlCreateSpy,
    commitSpy,
    elasticSearchUpdateSpy,
  },
  race,
  expectedJsonData,
  event,
) => {
  expect(calendarEventUpsertSpy).toHaveBeenCalledWith(
    event?.id,
    expect.objectContaining(expectedJsonData.CalendarEvent),
    expect.anything(),
  );
  expect(vesselParticipantGroupUpsertSpy).toHaveBeenCalledTimes(1);
  expect(vesselBulkCreateSpy).toHaveBeenCalledWith(
    expectedJsonData.Vessels,
    expect.anything(),
  );
  expect(vesselParticipantBulkCreateSpy).toHaveBeenCalledWith(
    expectedJsonData.VesselParticipants,
    expect.anything(),
  );
  if (expectedJsonData.Participants?.length > 0) {
    expect(vesselParticipantAddParticipantSpy).toHaveBeenCalledTimes(
      expectedJsonData.Participants.filter((p) => p.length > 0).length,
    );
    expect(participantBulkCreateSpy).toHaveBeenCalledTimes(
      expectedJsonData.Participants.length,
    );
    expectedJsonData.Participants.forEach((p) => {
      expect(participantBulkCreateSpy).toHaveBeenCalledWith(
        p.map((o) => expect.objectContaining(o)),
        expect.anything(),
      );
    });
  }
  expect(markTrackerUpsertSpy).toHaveBeenCalledTimes(
    expectedJsonData.MarkTrackers?.length ?? 0,
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
    expectedJsonData.VesselParticipantEvents?.length > 0 ? 1 : 0,
  );
  if (expectedJsonData.VesselParticipantEvents?.length) {
    expect(vesselParticipantEventBulkCreateSpy).toHaveBeenCalledWith(
      expectedJsonData.VesselParticipantEvents.map((i) =>
        expect.objectContaining(i),
      ),
      expect.anything(),
    );
  }
  expect(scrapedSuccessfulUrlCreateSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      url: race.slug || race.url,
      originalId: race.race_code || race.original_id.toString(),
      source: expectedJsonData.CalendarEvent.source,
    }),
    expect.anything(),
  );
  expect(commitSpy).toHaveBeenCalled();
  const expectedEsData = expectedJsonData.ElasticSearchBody
    ? [expect.objectContaining(expectedJsonData.ElasticSearchBody)]
    : expectedJsonData.ElasticSearchBodies.map((es) =>
        expect.objectContaining(es),
      );
  expect(elasticSearchUpdateSpy).toHaveBeenCalledWith(expectedEsData, [
    expect.objectContaining(expectedJsonData.CompetitionUnit),
  ]);
  expect(ogJob.addEvent).toHaveBeenCalledWith(
    {
      id: expect.any(String),
      position: expectedJsonData.CalendarEvent.location.coordinates,
    },
    { jobId: expect.any(String) },
  );
  expect(ogJob.addCompetitionUnit).toHaveBeenCalledWith(
    {
      idList: [race.id],
      position:
        expectedJsonData.CompetitionUnit.approximateStartLocation.coordinates,
    },
    { jobId: race.id },
  );
};

exports.createAndReturnSpies = () => {
  const spies = {};
  spies.calendarEventUpsertSpy = jest.spyOn(calendarEventDAL, 'upsert');
  spies.vesselParticipantGroupUpsertSpy = jest.spyOn(
    vesselParticipantGroupDAL,
    'upsert',
  );
  spies.vesselGetByVesselIdAndSourceSpy = jest.spyOn(
    vesselDAL,
    'getByVesselIdAndSource',
  );
  spies.vesselBulkCreateSpy = jest.spyOn(vesselDAL, 'bulkCreate');
  spies.vesselParticipantBulkCreateSpy = jest.spyOn(
    vesselParticipantDAL,
    'bulkCreate',
  );
  spies.vesselParticipantAddParticipantSpy = jest.spyOn(
    vesselParticipantDAL,
    'addParticipant',
  );
  spies.participantBulkCreateSpy = jest.spyOn(participantDAL, 'bulkCreate');
  spies.markTrackerUpsertSpy = jest.spyOn(markTrackerDAL, 'upsert');
  spies.courseUpsertSpy = jest.spyOn(courseDAL, 'upsert');
  spies.courseBulkInsertPointsSpy = jest.spyOn(courseDAL, 'bulkInsertPoints');
  spies.competitionUnitUpsertSpy = jest.spyOn(competitionUnitDAL, 'upsert');
  spies.vesselParticipantEventBulkCreateSpy = jest.spyOn(
    vesselParticipantEventDAL,
    'bulkCreate',
  );
  spies.syrfFailedUrlDALCreateSpy = jest.spyOn(syrfFailedUrlDAL, 'create');
  spies.scrapedSuccessfulUrlCreateSpy = jest.spyOn(
    scrapedSuccessfulUrlDAL,
    'create',
  );
  spies.commitSpy = jest.fn().mockResolvedValue();
  jest
    .spyOn(utils, 'createTransaction')
    .mockResolvedValue({ commit: spies.commitSpy, rollback: jest.fn() });
  spies.elasticSearchUpdateSpy = jest.spyOn(
    elasticsearch,
    'updateEventAndIndexRaces',
  );
  return spies;
};

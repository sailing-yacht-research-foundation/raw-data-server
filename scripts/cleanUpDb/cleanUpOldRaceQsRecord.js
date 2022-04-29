require('dotenv').config();
const { SOURCE } = require('../../src/constants');
const competitionUnitDataAccess = require('../../src/syrf-schema/dataAccess/v1/competitionUnit');
const calendarEventDataAccess = require('../../src/syrf-schema/dataAccess/v1/calendarEvent');
const scrapedSuccessfulUrlDataAccess = require('../../src/syrf-schema/dataAccess/v1/scrapedSuccessfulUrl');
const s3Util = require('../../src/utils/s3Util');
const elasticsearch = require('../../src/utils/elasticsearch');

const db = require('../../src/syrf-schema/index');
const Op = db.Op;

(async () => {
  let allCalendarEvents;
  console.log(`**********Start clean up old record for RaceQs **********`);
  do {
    allCalendarEvents = await db.CalendarEvent.findAll({
      where: {
        source: {
          [Op.eq]: SOURCE.RACEQS,
        },
      },
      limit: 20,
      raw: true,
    });
    for (const savedCalendarEvent of allCalendarEvents) {
      await _deleteCalendarEvent(savedCalendarEvent);
    }
  } while (allCalendarEvents?.length);
  console.log(`**********Finished clean up old record for RaceQs **********`);
})();

async function _deleteCalendarEvent(savedCalendarEvent) {
  let processed = 0;
  // get all CompetitionUnits that have the same calendar event
  const competitionUnits = await db.CompetitionUnit.findAll({
    where: {
      calendarEventId: {
        [Op.eq]: savedCalendarEvent.id,
      },
    },
    raw: true,
  });

  console.log(
    `There are ${competitionUnits.length} competitionUnits for ${savedCalendarEvent.scrapedOriginalId} competition units to be cleared`,
  );
  let transaction;

  try {
    transaction = await db.sequelize.transaction();
    for (const competitionUnit of competitionUnits) {
      console.log(
        `Start clean up the data for competitionUnit.id =  ${competitionUnit.id}`,
      );
      await _deleteVesselParticipantTrackJsons(competitionUnit.id);
      await _deleteOpenGraphImage(competitionUnit.id);
      await competitionUnitDataAccess.delete(competitionUnit.id, transaction);
      await _cleanUpElasticSearch(competitionUnit.id);
      // since there are many competition unit that shared the same scrapedOriginalId, so we need to do this check
      const countCompetitionUnit = await _countCompetitionUnitScrapedOriginalId(
        competitionUnit.scrapedOriginalId,
      );
      if (countCompetitionUnit === 1) {
        await scrapedSuccessfulUrlDataAccess.deleteByOriginalId(
          {
            originalId: competitionUnit.scrapedOriginalId,
            source: SOURCE.RACEQS,
          },
          transaction,
        );
      }
      processed++;
    }
    await calendarEventDataAccess.delete(savedCalendarEvent.id, transaction);
    await transaction.commit();

    console.log(
      `Finish clean up the data for calendarEvent.scrapedOriginalId =  ${savedCalendarEvent.scrapedOriginalId}, total number of competitionUnit = ${processed}`,
    );
  } catch (ex) {
    if (transaction) {
      await transaction.rollback();
    }
    console.log(
      `exception happened during clean up the data for calendarEvent.original_id = ${savedCalendarEvent.original_id}`,
    );
    console.log(ex);
  }
  return processed;
}

async function _deleteVesselParticipantTrackJsons(competitionUnitId) {
  const bucket = process.env.AWS_S3_TRACKS_GEOJSON_BUCKET;
  const folder = `individual-tracks/${competitionUnitId}`;
  try {
    console.log(`Start cleaning up ParticipantTrackJsons, folder = ${folder} `);
    await s3Util.deleteDirectory(bucket, folder);
    console.log(
      `Finished cleaning up ParticipantTrackJsons, folder = ${folder} `,
    );
  } catch (ex) {
    console.log(`Exception happened during _deleteVesselParticipantTrackJsons`);
    console.log(ex);
    throw ex;
  }
}

async function _deleteOpenGraphImage(competitionUnitId) {
  const bucket = process.env.OPEN_GRAPH_BUCKET_NAME;
  const folder = `public/competition/${competitionUnitId}`;
  try {
    console.log(`Start cleaning up open graph image, folder = ${folder} `);
    await s3Util.deleteDirectory(bucket, folder);
    console.log(`Finished cleaning up open graph image, folder = ${folder} `);
  } catch (ex) {
    console.log(
      `Exception happened during _deleteOpenGraphImage for competitionUnitId = ${competitionUnitId}`,
    );
    console.log(ex);
    throw ex;
  }
}
async function _cleanUpElasticSearch(competitionUnitId) {
  console.log(`Start clean up elastic search = ${competitionUnitId}`);
  await elasticsearch.deleteByIds([competitionUnitId]);
  console.log(`Finished clean up elastic search = ${competitionUnitId}`);
}

async function _countCompetitionUnitScrapedOriginalId(scrapedOriginalId) {
  return await db.CompetitionUnit.count({
    where: {
      scrapedOriginalId: {
        [Op.eq]: scrapedOriginalId,
      },
    },
  });
}

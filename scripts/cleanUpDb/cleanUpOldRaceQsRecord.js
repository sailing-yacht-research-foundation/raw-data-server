require('dotenv').config();
const { SOURCE } = require('../../src/constants');
const { getExistingData } = require('../../src/services/scrapedDataResult');
const competitionUnitDataAccess = require('../../src/syrf-schema/dataAccess/v1/competitionUnit');
const calendarEventDataAccess = require('../../src/syrf-schema/dataAccess/v1/calendarEvent');
const scrapedSuccessfulUrlDataAccess = require('../../src/syrf-schema/dataAccess/v1/scrapedSuccessfulUrl');
const s3Util = require('../../src/services/s3Util');
const elasticsearch = require('../../src/utils/elasticsearch');

const db = require('../../src/syrf-schema/index');
const Op = db.Op;

(async () => {
  const existingData = await getExistingData(SOURCE.RACEQS);
  console.log(`**********Start clean up old record for RaceQs**********`);
  let totalProcessed = 0;
  for (const savedData of existingData) {
    const processed = await _deleteCompetitionUnits(savedData);
    totalProcessed += processed;
  }
  console.log(
    `**********Finished clean up old record for RaceQs, There are ${totalProcessed} competitionUnits to be cleared **********`,
  );
})();

async function _deleteCompetitionUnits(scrapedData) {
  let processed = 0;
  // get all CompetitionUnits that have the same original_id
  const competitionUnits = await db.CompetitionUnit.findAll({
    where: {
      scrapedOriginalId: {
        [Op.eq]: scrapedData.original_id,
      },
    },
    raw: true,
  });

  console.log(
    `There are ${competitionUnits.length} competitionUnits for ${scrapedData.original_id}`,
  );
  let transaction;

  try {
    transaction = await db.sequelize.transaction();
    for (const currentCompetitionUnit of competitionUnits) {
      // process all CompetitionUnit on same calendar event
      const allCompetitionOnCalendarEvent = await db.CompetitionUnit.findAll({
        where: {
          calendarEventId: currentCompetitionUnit.calendarEventId,
        },
        attributes: ['id'],
        raw: true,
        transaction,
      });

      console.log(
        `for calendarEventId = ${currentCompetitionUnit.calendarEventId}, there are  ${allCompetitionOnCalendarEvent.length} competition units to be cleared`,
      );
      for (const competitionUnit of allCompetitionOnCalendarEvent) {
        console.log(
          `Start clean up the data for competitionUnit.id =  ${competitionUnit.id}`,
        );
        await _deleteVesselParticipantTrackJsons(competitionUnit.id);
        await _deleteOpenGraphImage(competitionUnit.id);
        await competitionUnitDataAccess.delete(competitionUnit.id, transaction);
        await _cleanUpElasticSearch(competitionUnit.id);
        console.log(
          `Finish clean up the data for competitionUnit.id =  ${competitionUnit.id}`,
        );
      }
      await calendarEventDataAccess.delete(
        currentCompetitionUnit.calendarEventId,
        transaction,
      );
    }
    await scrapedSuccessfulUrlDataAccess.deleteByOriginalId(
      scrapedData.original_id,
      transaction,
    );
    transaction.commit();
    processed++;
  } catch (ex) {
    if (transaction) {
      transaction.rollback();
    }
    console.log(
      `exception happened during clean up the data for scrapedData.original_id = ${scrapedData.original_id}`,
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
  }
}
async function _cleanUpElasticSearch(competitionUnitId) {
  console.log(`Start clean up elastic search = ${competitionUnitId}`);
  await elasticsearch.deleteByIds([competitionUnitId]);
  console.log(`Finished clean up elastic search = ${competitionUnitId}`);
}

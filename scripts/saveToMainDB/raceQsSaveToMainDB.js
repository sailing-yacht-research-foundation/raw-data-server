require('dotenv').config();
const db = require('../../src/models');
const Op = db.Sequelize.Op;
const { SOURCE } = require('../../src/constants');
const { getExistingData } = require('../../src/services/scrapedDataResult');
const mapRaceQsToSyrf = require('../../src/services/mappingsToSyrfDB/mapRaceQsToSyrf');
const {
  normalizeRace,
} = require('../../src/services/normalization/normalizeRaceQs');
const elasticsearch = require('../../src/utils/elasticsearch');
(async () => {
  const limit = 10;
  let page = 0;
  let shouldContinue = true;
  const existingData = await getExistingData(SOURCE.RACEQS);

  const existingOriginalIds = new Set(existingData.map((t) => t.original_id));
  while (shouldContinue) {
    const raceQsEvents = await db.raceQsEvent.findAll({
      raw: true,
      limit,
      offset: page * limit,
      order: [['original_id', 'ASC']],
    });
    if (raceQsEvents.length === 0) {
      shouldContinue = false;
      break;
    }

    console.log(`Processing ${raceQsEvents.length} raceQsEvents`);
    for (const raceQsEvent of raceQsEvents) {
      try {
        console.log(
          `Processing raceQsEvents with original_id = ${raceQsEvent.original_id}`,
        );
        const raceFilter = {
          where: {
            event: raceQsEvent.id,
            original_id: {
              [Op.notIn]: existingData.map((d) => d.original_id),
            },
          },
          raw: true,
        };
        const raceQsDivision = await db.raceQsDivision.findAll(raceFilter);

        if (!raceQsDivision.length) {
          console.log(
            `this raceQsEvent = ${raceQsEvent.original_id} is already processed, continue to next event`,
          );
          continue;
        }
        const eventFilter = {
          where: {
            event: raceQsEvent.id,
          },
          raw: true,
        };
        // we only filter by event to make sure that the division does not have start check
        let raceQsStart = await db.raceQsStart.findAll(eventFilter);

        // filter out processed start
        if (raceQsStart.length > 0) {
          raceQsStart = raceQsStart.filter(
            (t) => !existingOriginalIds.has(t.original_id),
          );

          if (!raceQsStart.length) {
            continue;
          }
        }
        const raceQsRegaData = await db.raceQsRegatta.findAll({
          where: {
            id: raceQsEvent.regatta,
          },
          raw: true,
        });

        const raceQsPosition = await db.raceQsPosition.findAll(eventFilter);

        const raceQsParticipant = await db.raceQsParticipant.findAll(
          eventFilter,
        );
        const raceQsRoute = await db.raceQsRoute.findAll(eventFilter);

        const raceQsWaypoint = await db.raceQsWaypoint.findAll(eventFilter);

        const objectToPass = {
          RaceQsEvent: [raceQsEvent],
          RaceQsRegatta: raceQsRegaData,
          RaceQsPosition: raceQsPosition,
          RaceQsDivision: raceQsDivision,
          RaceQsParticipant: raceQsParticipant,
          RaceQsRoute: raceQsRoute,
          RaceQsStart: raceQsStart,
          RaceQsWaypoint: raceQsWaypoint,
        };
        const transaction = await db.sequelize.transaction();
        try {
          // in the old code of saveRaceQsData.js
          // we normalize the race by raceQsEvent, but it is not true
          // in the logic,  we normalize the race by division and start
          // in case there is a start in division, raceId = start.id
          // in case there is no start, raceId = division.id
          const raceMetadatas = await normalizeRace(objectToPass, transaction);
          await transaction.commit();
          await mapRaceQsToSyrf(objectToPass, raceMetadatas);
          console.log('Finished saving race');
          // Since we change the logic of normalizeRace, so we need to delete the raceQsEvent.id
          try {
            await elasticsearch.deleteByIds([raceQsEvent.id]);
          } catch (e) {
            console.log(
              `Failed to delete raceQsEvent.id = ${raceQsEvent.id} from elastic search`,
            );
            console.log(e);
          }
        } catch (err) {
          await transaction.rollback();
          console.log('Failed saving to syrf main DB', err);
        }
      } catch (err) {
        console.log('Error occured getting regatta data', err);
      }
    }
    page++;
  }
  console.log('Finished saving all scraper db data to main db');
})();

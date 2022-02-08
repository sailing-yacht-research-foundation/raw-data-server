require('dotenv').config();
const db = require('../../src/models');
const Op = db.Sequelize.Op;
const { SOURCE, RACEQS } = require('../../src/constants');
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

  // The saved format in main database is raceqs-start-{eventId}-{startId}.
  const savedStartOriginalIds = new Set(
    existingData
      .map((t) => t.original_id)
      .filter((t) => {
        return t?.indexOf(RACEQS.START_PREFIX) > -1;
      })
      .map((t) => t.replace(RACEQS.START_PREFIX, '').split('-')[1]),
  );
  // This map is used for map the event id with processed division ids
  // For example: eventId = 'eventId-0' has 3 processed divisions 'divisionId-0', 'divisionId-1', 'divisionId-2'
  // the saved format in main database is raceqs-division-{eventId}-{divisionId}.
  // For example: raceqs-division-1234-5678. It means eventId = 1234, divisionId = 5678
  const eventDivisionMap = {};
  for (const savedData of existingData) {
    if (savedData.original_id.indexOf(RACEQS.DIVISION_PREFIX) === -1) {
      continue;
    }
    const [savedEventId, savedDivisionId] = savedData.original_id
      .replace(RACEQS.DIVISION_PREFIX, '')
      .split('-');
    if (!eventDivisionMap[savedEventId]) {
      eventDivisionMap[savedEventId] = new Set();
    }
    eventDivisionMap[savedEventId].add(savedDivisionId);
  }
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
          },
          raw: true,
        };
        const raceQsDivision = await db.raceQsDivision.findAll(raceFilter);

        const eventFilter = {
          where: {
            event: raceQsEvent.id,
          },
          raw: true,
        };
        // we only filter by event to make sure that the division does not have start check
        let raceQsStart = await db.raceQsStart.findAll(eventFilter);

        // in case there is no start, and first division is already processed
        if (
          raceQsStart.length === 0 &&
          eventDivisionMap[raceQsEvent.original_id]?.has(
            raceQsDivision[0]?.original_id,
          )
        ) {
          console.log(
            `this raceQsEvent = ${raceQsEvent.original_id} has no start, and the first division is already processed, continue to next event`,
          );
          continue;
        }
        // filter out processed start
        if (raceQsStart.length > 0) {
          raceQsStart = raceQsStart.filter(
            (t) => !savedStartOriginalIds.has(t.original_id),
          );

          if (!raceQsStart.length) {
            console.log(
              `All of starts for this raceQsEvent = ${raceQsEvent.original_id} have been processed, continue to next event`,
            );
            continue;
          }
        }
        const raceQsRegatta = await db.raceQsRegatta.findAll({
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
          RaceQsRegatta: raceQsRegatta,
          RaceQsPosition: raceQsPosition,
          RaceQsDivision: raceQsDivision,
          RaceQsParticipant: raceQsParticipant,
          RaceQsRoute: raceQsRoute,
          RaceQsStart: raceQsStart,
          RaceQsWaypoint: raceQsWaypoint,
        };
        try {
          // in the old code of saveRaceQsData.js
          // we normalize the race by raceQsEvent, but it is not true
          // in the logic,  we normalize the race by division and start
          // in case there is a start in division, raceId = start.id
          // in case there is no start, raceId = division.id
          const raceMetadatas = await normalizeRace(objectToPass);
          await mapRaceQsToSyrf(objectToPass, raceMetadatas);
          console.log(
            `Finished saving race raceQsEvent.original_id = ${raceQsEvent.original_id}`,
          );
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

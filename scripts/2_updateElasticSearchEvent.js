require('dotenv').config();
const syrfDb = require('../src/syrf-schema');
const { SOURCE } = require('../src/constants');
const elasticsearch = require('../src/utils/elasticsearch');

/**
 * This script updates elastic search event ids so it is the same as in the DB.
 * The script also deletes dangling races in elastic search not existing in DB.
 *
 */
(async () => {
  const failedIds = [];
  // Sources that reuses event ids
  const sources = [
    SOURCE.GEORACING,
    SOURCE.ISAIL,
    SOURCE.KWINDOO,
    SOURCE.METASAIL,
    SOURCE.RACEQS,
    SOURCE.TACKTRACKER,
    SOURCE.TRACTRAC,
  ];
  for (const source of sources) {
    console.log(`Updating ${source} races`);
    try {
      const dbRaces = await syrfDb.sequelize.query(
        `
          SELECT c.id AS "raceId", e.id AS "eventId" FROM "CalendarEvents" e INNER JOIN "CompetitionUnits" c ON c."calendarEventId" = e.id WHERE e.source = :source
      `,
        {
          replacements: { source },
          type: syrfDb.sequelize.QueryTypes.SELECT,
        },
      );
      console.log(`${source} has a total of ${dbRaces.length} in database`);
      const eventIds = dbRaces.map((r) => r.eventId);
      const esRaces = await elasticsearch.getRaceWithDanglingEventsBySource(
        source,
        eventIds,
      );
      console.log(`${source} has ${esRaces.length} races with dangling events`);
      for (const esRace of esRaces) {
        try {
          const dbRace = dbRaces.find((r) => r.raceId === esRace._id);
          if (dbRace) {
            if (dbRace.eventId) {
              console.log(
                `Update esRace ${esRace._id} with event id ${dbRace.eventId}`,
              );
              await elasticsearch.updateRace(esRace._id, {
                event: dbRace.eventId,
              });
            }
          } else {
            // If esRace._id does not exist in DB, then it is dangling race and delete
              console.log(
                `Race ${esRace._id} not found in DB deleting race `,
              );
            await elasticsearch.deleteByIds([esRace._id]);
          }
        } catch (err) {
          console.log(
            `Error occured updating race ${esRace._id} source ${source}`,
            err,
          );
          failedIds.push({ id: esRace._id, source, error: err });
        }
      }
    } catch (err) {
      console.log(`Error occured updating races for source ${source}`, err);
    }
    console.log(`Finished updating races for source ${source}. Failed ids are`, failedIds);
  }
  console.log('Finished updating all sources on elastic search. Failed ids are', failedIds);
})();

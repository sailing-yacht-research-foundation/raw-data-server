require('dotenv').config();
const syrfDb = require('../src/syrf-schema');
const { SOURCE } = require('../src/constants');
const elasticsearch = require('../src/utils/elasticsearch');

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
          if (dbRace?.eventId) {
            console.log(
              `Update esRace ${esRace._id} with event id ${dbRace.eventId}`,
            );
            elasticsearch.updateRace(esRace._id, {
              event: dbRace.eventId,
            });
          }
        } catch (err) {
          console.log(
            `Error occured updating race ${esRace.id} source ${source}`,
            err,
          );
          failedIds.push({ id: esRace.id, source, error: err });
        }
      }
    } catch (err) {
      console.log(`Error occured updating races for source ${source}`, err);
    }
    console.log(`Finished updating races for source ${source}`, failedIds);
  }
  console.log('Finished updating all sources on elastic search', failedIds);
})();

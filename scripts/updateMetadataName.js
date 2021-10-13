require('dotenv').config();
const db = require('../src/models');
const elasticsearch = require('../src/utils/elasticsearch');

const { generateMetadataName } = require('../src/utils/gisUtils');

(async () => {
  const scraperMapping = [
    {
      source: 'ISAIL',
      raceTable: 'iSailRaces',
      eventTable: 'iSailEvents',
      eventColumn: 'event',
    },
    {
      source: 'TRACTRAC',
      raceTable: 'TracTracRaces',
      eventTable: 'TracTracEvents',
      eventColumn: 'event',
    },
    {
      source: 'RACEQS',
      raceTable: 'RaceQsEvents',
      eventTable: 'RaceQsRegattas',
      eventColumn: 'regatta',
    },
  ];
  for (const scraper of scraperMapping) {
    let records;
    try {
      records = await db.sequelize.query(
        `
        SELECT m.id, r.name AS race_name, e.name AS event_name, approx_start_time_ms FROM "ReadyAboutRaceMetadatas" m
        INNER JOIN "${scraper.raceTable}" r ON r.id = m.id
        INNER JOIN "${scraper.eventTable}" e ON e.id = r.${scraper.eventColumn}
        WHERE SOURCE = '${scraper.source}' ORDER BY approx_start_time_ms
      `,
        { type: db.sequelize.QueryTypes.SELECT },
      );
    } catch (err) {
      console.log('Failed getting metadata', err);
    }

    for (const record of records) {
      const id = record.id;
      const newName = generateMetadataName(
        record.event_name,
        record.race_name,
        record.approx_start_time_ms,
      );
      console.log(`newName for id ${id}`, newName);

      try {
        await db.readyAboutRaceMetadata.update(
          { name: newName },
          {
            where: { id },
          },
        );
      } catch (err) {
        console.error(`Failed updating metadata ${id}:`, err);
      }
      try {
        await elasticsearch.updateRace(id, {
          name: newName,
        });
      } catch (err) {
        if (err.status === 404) {
          console.log(`Does not exist in elastic search ${id}`);
        }
        console.error(`Failed updating elastic search ${id}:`, err);
      }
    }
  }

  console.log('Finished updating metadata name');
})();

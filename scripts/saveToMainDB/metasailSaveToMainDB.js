require('dotenv').config();
const db = require('../../src/models');
const Op = db.Sequelize.Op;
const { SOURCE } = require('../../src/constants');
const { getExistingData } = require('../../src/services/scrapedDataResult');
const mapAndSave = require('../../src/services/mappingsToSyrfDB/mapMetasailToSyrf');

(async () => {
  const limit = 10;
  let page = 0;
  let shouldContinue = true;
  const existingData = await getExistingData(SOURCE.METASAIL);

  while (shouldContinue) {
    const events = await db.metasailEvent.findAll({
      raw: true,
      limit,
      offset: page * limit,
      order: [['original_id', 'ASC']],
    });
    if (events.length === 0) {
      shouldContinue = false;
      break;
    }

    console.log(`Processing ${events.length} events`);
    for (const event of events) {
      try {
        const objectToPass = {
          MetasailEvent: [event],
        };
        const races = await db.metasailRace.findAll({
          attributes: [
            'id',
            'original_id',
            'event',
            'event_original_id',
            'name',
            'start',
            'stop',
            'url',
            'passings',
          ],
          where: {
            event: event.id,
            original_id: {
              [Op.notIn]: existingData.map((d) => d.original_id),
            },
          },
          raw: true,
        });

        console.log(`Processing ${races.length} races`);
        for (const race of races) {
          const raceFilter = {
            where: {
              race: race.id,
            },
            raw: true,
          };

          const boats = await db.metasailBoat.findAll(raceFilter);

          if (boats.length === 0) {
            console.log(
              `Race original id ${race.original_id} does not have participating boats. Skipping`,
            );
            continue;
          }

          const boatPositions = await db.metasailPosition.findAll(raceFilter);

          if (boatPositions.length === 0) {
            console.log(
              `Race original id ${race.original_id} does not have boat positions. Skipping`,
            );
            continue;
          }

          const raceMetadatas = await db.readyAboutRaceMetadata.findAll({
            where: {
              id: race.id,
            },
            raw: true,
          });

          if (!raceMetadatas?.length) {
            console.log(
              `Race original id ${race.original_id} does not have metadata. Skipping`,
            );
            continue;
          }

          const buoys = await db.metasailBuoy.findAll(raceFilter);
          const gates = await db.metasailGate.findAll(raceFilter);

          objectToPass.MetasailRace = [race];
          objectToPass.MetasailBoat = boats;
          objectToPass.MetasailPosition = boatPositions;
          objectToPass.MetasailBuoy = buoys;
          objectToPass.MetasailGate = gates;

          try {
            console.log(`Saving to syrf DB for race ${race.original_id}`);
            await mapAndSave(objectToPass, raceMetadatas);
            console.log('Finished saving race');
          } catch (err) {
            console.log('Failed saving to syrf main DB', err);
          }
        } // race loop
      } catch (err) {
        console.log('Error occured getting event data', err);
      }
    }
    console.log(`Finished processing ${events.length} events`);
    page++;
  }
  console.log('Finished saving all scraper db data to main db');
})();

require('dotenv').config();
const db = require('../../src/models');
const Op = db.Sequelize.Op;
const { SOURCE } = require('../../src/constants');
const { getExistingData } = require('../../src/services/scrapedDataResult');
const mapAndSave = require('../../src/services/mappingsToSyrfDB/mapKwindooToSyrf');

(async () => {
  const limit = 10;
  let page = 0;
  let shouldContinue = true;
  const existingData = await getExistingData(SOURCE.KWINDOO);

  while (shouldContinue) {
    const regattas = await db.kwindooRegatta.findAll({
      raw: true,
      limit,
      offset: page * limit,
      order: [['original_id', 'ASC']],
    });
    if (regattas.length === 0) {
      shouldContinue = false;
      break;
    }

    console.log(`Processing ${regattas.length} regattas`);
    for (const regatta of regattas) {
      try {
        const objectToPass = {
          KwindooRegatta: [regatta],
        };
        const races = await db.kwindooRace.findAll({
          where: {
            regatta: regatta.id,
            original_id: {
              [Op.notIn]: existingData.map((d) => d.original_id),
            },
          },
          raw: true,
        });

        console.log(`Processing ${races.length} races`);
        for (const race of races) {
          // if (existingData.some((d) => d.url === race.url || d.original_id === race.original_id)) {
          //   console.log(`Race original id ${race.original_id} already saved in DB`);
          //   continue;
          // }
          const raceFilter = {
            where: {
              race: race.id,
            },
            raw: true,
          };

          const boats = await db.kwindooBoat.findAll(raceFilter);

          if (boats.length === 0) {
            console.log(
              `Race original id ${race.original_id} does not have participating boats. Skipping`,
            );
            continue;
          }

          const boatPositions = await db.kwindooPosition.findAll(raceFilter);

          if (boatPositions.length === 0) {
            console.log(
              `Race original id ${race.original_id} does not have boat positions. Skipping`,
            );
            continue;
          }

          const waypoints = await db.kwindooWaypoint.findAll(raceFilter);

          const raceMetadatas = await db.readyAboutRaceMetadata.findAll({
            where: {
              id: race.id,
            },
            raw: true,
          });

          objectToPass.KwindooRace = [race];
          objectToPass.KwindooBoat = boats;
          objectToPass.KwindooPosition = boatPositions;
          objectToPass.KwindooWaypoint = waypoints;

          try {
            console.log(`Saving to syrf DB for race ${race.original_id}`);
            // console.log('objectToPass', objectToPass);
            // console.log('raceMetadata', raceMetadata);
            await mapAndSave(objectToPass, raceMetadatas);
            console.log('Finished saving race');
          } catch (err) {
            console.log('Failed saving to syrf main DB', err);
          }
        } // race loop
      } catch (err) {
        console.log('Error occured getting regatta data', err);
      }
    }
    console.log(`Finished processing ${regattas.length} regattas`);
    page++;
  }
  console.log('Finished saving all scraper db data to main db');
})();

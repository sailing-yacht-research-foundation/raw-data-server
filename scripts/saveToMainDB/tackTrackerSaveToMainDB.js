require('dotenv').config();
const db = require('../../src/models');
const Op = db.Sequelize.Op;
const { SOURCE } = require('../../src/constants');
const { getExistingData } = require('../../src/services/scrapedDataResult');
const mapAndSave = require('../../src/services/mappingsToSyrfDB/mapTackTrackerToSyrf');

(async () => {
  const limit = 10;
  let page = 0;
  let shouldContinue = true;
  const existingData = await getExistingData(SOURCE.TACKTRACKER);

  while (shouldContinue) {
    const races = await db.tackTrackerRace.findAll({
      where: {
        original_id: {
          [Op.notIn]: existingData.map((d) => d.original_id),
        },
      },
      raw: true,
      limit,
      offset: page * limit,
      order: [['original_id', 'ASC']],
    });
    if (races.length === 0) {
      shouldContinue = false;
      break;
    }

    console.log(`Processing ${races.length} races`);
    for (const race of races) {
      try {
        const raceFilter = {
          where: {
            race: race.id,
          },
          raw: true,
        };

        const boats = await db.tackTrackerBoat.findAll(raceFilter);

        if (boats.length === 0) {
          console.log(
            `Race original id ${race.original_id} does not have participating boats. Skipping`,
          );
          continue;
        }

        const positions = await db.tackTrackerPosition.findAll(raceFilter);

        if (positions.length === 0) {
          console.log(
            `Race original id ${race.original_id} does not have boat positions. Skipping`,
          );
          continue;
        }

        const raceMetadata = await db.readyAboutRaceMetadata.findOne({
          where: {
            id: race.id,
          },
          raw: true,
        });

        if (!raceMetadata) {
          console.log(
            `Race original id ${race.original_id} does not have metadata. Skipping`,
          );
          continue;
        }

        const finishes = await db.tackTrackerFinish.findAll(raceFilter);
        const marks = await db.tackTrackerMark.findAll(raceFilter);
        const starts = await db.tackTrackerStart.findAll(raceFilter);

        const objectToPass = {
          TackTrackerRace: [race],
          TackTrackerBoat: boats,
          TackTrackerPosition: positions,
          TackTrackerFinish: finishes,
          TackTrackerMark: marks,
          TackTrackerStart: starts,
        };

        if (race.regatta) {
          const regatta = await db.tackTrackerRegatta.findOne({
            where: {
              id: race.regatta,
            },
            raw: true,
          });
          objectToPass.TackTrackerRegatta = [regatta];
        }

        try {
          console.log(
            `Saving to syrf DB for race original id ${race.original_id}`,
          );
          await mapAndSave(objectToPass, raceMetadata);
          console.log('Finished saving race');
        } catch (err) {
          console.log('Failed saving to syrf main DB', err);
        }
      } catch (err) {
        console.log('Error occured getting race data', err);
      }
    }
    console.log(`Finished processing ${races.length} races`);
    page++;
  }
  console.log('Finished saving all scraper db data to main db');
})();

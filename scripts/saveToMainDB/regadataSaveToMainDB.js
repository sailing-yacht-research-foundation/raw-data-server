require('dotenv').config();
const db = require('../../src/models');
const Op = db.Sequelize.Op;
const { SOURCE } = require('../../src/constants');
const { getExistingData } = require('../../src/services/scrapedDataResult');
const mapAndSave = require('../../src/services/mappingsToSyrfDB/mapRegadataToSyrf');

(async () => {
  const limit = 10;
  let page = 0;
  let shouldContinue = true;
  const existingData = await getExistingData(SOURCE.REGADATA);

  while (shouldContinue) {
    const races = await db.regadataRace.findAll({
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
      console.log(races.length);
      try {
        const raceFilter = {
          where: {
            race_id: race.id,
          },
          raw: true,
        };

        const regadataReports = await db.regadataReport.findAll(raceFilter);

        if (regadataReports.length === 0) {
          console.log(
            `Race original id ${race.original_id} does not have reports entry. Skipping`,
          );
          continue;
        }

        const regadataSails = await db.regadataSail.findAll(raceFilter);

        if (regadataSails.length === 0) {
          console.log(
            `Race original id ${race.original_id} does not have reports entry. Skipping`,
          );
          continue;
        }

        const raceMetadata = (
          await db.readyAboutRaceMetadata.findAll({
            where: {
              id: race.id,
            },
            raw: true,
          })
        )[0];

        if (!raceMetadata) {
          console.log(
            `Race original id ${race.original_id} does not have metadata. Skipping`,
          );
          continue;
        }

        const objectToPass = {
          race: race,
          reports: regadataReports,
          sails: regadataSails,
        };

        try {
          console.log(
            `Saving to syrf DB for race original id ${race.original_id}`,
          );
          await mapAndSave(objectToPass, raceMetadata);
          console.log('Finished saving race');
        } catch (err) {
          console.log('Failed saving to syrf main DB', err);
        }
      } catch (e) {
        console.log('Error occured getting race data', e);
      }
    }
    console.log(`Finished processing ${races.length} races`);
    page++;
  }
})();

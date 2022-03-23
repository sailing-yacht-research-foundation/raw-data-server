require('dotenv').config();
const db = require('../../src/models');
const Op = db.Sequelize.Op;
const { SOURCE } = require('../../src/constants');
const { getExistingData } = require('../../src/services/scrapedDataResult');
const mapAndSave = require('../../src/services/mappingsToSyrfDB/mapAmericasCup2021ToSyrf');

(async () => {
  const limit = 10;
  let page = 0;
  let shouldContinue = true;
  const existingData = await getExistingData(SOURCE.AMERICASCUP2021);

  while (shouldContinue) {
    const races = await db.americasCup2021Race.findAll({
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
            race_id: race.id,
          },
          raw: true,
        };

        const boats = await db.americasCup2021Boat.findAll(raceFilter);
        if (boats.length === 0) {
          console.log(
            `Race original id ${race.original_id} does not have participating boats. Skipping`,
          );
          continue;
        }

        const teams = await db.americasCup2021Team.findAll(raceFilter);

        const boatPositions = await db.americasCup2021BoatPosition.findAll(
          raceFilter,
        );

        if (boatPositions.length === 0) {
          console.log(
            `Race original id ${race.original_id} does not have boat positions. Skipping`,
          );
          continue;
        }

        const boatTwds = await db.americasCup2021BoatTwd.findAll(raceFilter);

        const boatTwss = await db.americasCup2021BoatTws.findAll(raceFilter);

        const boatVmgs = await db.americasCup2021BoatVmg.findAll(raceFilter);

        const buoys = await db.americasCup2021Buoy.findAll(raceFilter);

        const buoyPositions = await db.americasCup2021BuoyPosition.findAll(
          raceFilter,
        );

        const roundingTimes = await db.americasCup2021RoundingTime.findAll(
          raceFilter,
        );

        const rankings = await db.americasCup2021BoatRank.findAll(raceFilter);

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
          race,
          boats: {
            boats,
            teams,
          },
          boatPositions: {
            boatPositions,
            boatTwds,
            boatTwss,
            boatVmgs,
          },
          buoys: {
            buoys,
            buoyPositions,
            roundingTimes,
          },
          ranking: rankings,
        };

        try {
          console.log(
            `Saving to syrf DB for race original id ${race.original_id}`,
          );
          await mapAndSave(objectToPass, raceMetadata);
          console.log('Finished saving race');
        } catch (e) {
          console.log('Failed saving to syrf main DB', e);
        }
      } catch (e) {
        console.log('Error occured getting race data', e);
      }
    }
    console.log(`Finished processing ${races.length} races`);
    page++;
  }
  console.log('Finished saving all scraper db data to main db');
})();

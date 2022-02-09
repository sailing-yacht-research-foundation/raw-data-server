require('dotenv').config();
const db = require('../../src/models');
const Op = db.Sequelize.Op;
const { SOURCE } = require('../../src/constants');
const { getExistingData } = require('../../src/services/scrapedDataResult');
const mapGeovoileToSyrf = require('../../src/services/mappingsToSyrfDB/mapGeovoileToSyrf');

(async () => {
  const limit = 10;
  let page = 0;
  let shouldContinue = true;
  const existingData = await getExistingData(SOURCE.GEOVOILE);

  while (shouldContinue) {
    const races = await db.geovoileRace.findAll({
      where: {
        scrapedUrl: {
          [Op.notIn]: existingData.map((d) => d.url),
        },
      },
      raw: true,
      limit,
      offset: page * limit,
      order: [['scrapedUrl', 'ASC']],
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

        const boats = await db.geovoileBoat.findAll(raceFilter);

        if (boats.length === 0) {
          console.log(
            `Race original id ${race.race_code} does not have participating boats. Skipping`,
          );
          continue;
        }

        const positions = await db.geovoileBoatPosition.findAll(raceFilter);

        if (positions.length === 0) {
          console.log(
            `Race original id ${race.race_code} does not have boat positions. Skipping`,
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
            `Race original id ${race.race_code} does not have metadata. Skipping`,
          );
          continue;
        }

        const marks = await db.geovoileMark.findAll(raceFilter);
        const courseGates = await db.GeovoileGeometryGate.findAll(raceFilter);
        const sailors = await db.geovoileBoatSailor.findAll(raceFilter);

        const objectToPass = {
          geovoileRace: race,
          marks,
          boats,
          courseGates,
          sailors,
          positions,
        };

        try {
          console.log(
            `Saving to syrf DB for race with scrapedUrl = ${race.scrapedUrl}`,
          );
          await mapGeovoileToSyrf(objectToPass, raceMetadata);
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

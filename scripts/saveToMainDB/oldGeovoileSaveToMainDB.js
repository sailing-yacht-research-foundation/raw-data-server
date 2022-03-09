require('dotenv').config();
const db = require('../../src/models');
const Op = db.Sequelize.Op;
const { SOURCE } = require('../../src/constants');
const { getExistingData } = require('../../src/services/scrapedDataResult');
const mapAndSave = require('../../src/services/mappingsToSyrfDB/mapOldGeovoileToSyrf');

(async () => {
  const limit = 10;
  let page = 0;
  let shouldContinue = true;
  const existingData = await getExistingData(SOURCE.OLDGEOVOILE);

  while (shouldContinue) {
    const races = await db.oldGeovoileRace.findAll({
      where: {
        url: {
          [Op.notIn]: existingData.map((d) => d.url),
        },
      },
      raw: true,
      limit,
      offset: page * limit,
      order: [['id', 'ASC']],
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

        const boats = await db.oldGeovoileBoat.findAll(raceFilter);

        if (boats.length === 0) {
          console.log(
            `Race url ${race.url} does not have participating boats. Skipping`,
          );
          continue;
        }

        const boatPositions = await db.oldGeovoileBoatPosition.findAll(
          raceFilter,
        );

        const sortedPositions = boatPositions.sort((a, b) => {
          a.timestamp = Number(a.timestamp);
          b.timestamp = Number(b.timestamp);
          return a.timestamp - b.timestamp;
        });

        if (sortedPositions.length === 0) {
          console.log(
            `Race url ${race.url} does not have boat positions. Skipping`,
          );
          continue;
        }

        let discard = false;
        for (let i = 0; i < sortedPositions.length; ++i) {
          if (!sortedPositions[i].lat && !sortedPositions[i].lon) {
            discard = true;
            break;
          }
        }

        if (discard) {
          console.log(`Race url ${race.url} has 0,0 positions. Skipping`);
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
          console.log(`Race url ${race.url} does not have metadata. Skipping`);
          continue;
        }

        // Add leg number in race name
        const legParam = 'leg=';
        if (race.url.indexOf(legParam) > -1) {
          const legNo = race.url.split(legParam)[1];
          if (legNo) {
            race.name += ` Leg ${legNo}`;
          }
        }

        const objectToPass = {
          race: race,
          boats: boats,
          positions: sortedPositions,
        };
        try {
          console.log(`Saving to syrf DB for race url ${race.url}`);
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

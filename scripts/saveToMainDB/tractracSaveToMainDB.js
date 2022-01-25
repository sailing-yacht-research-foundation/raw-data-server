require('dotenv').config();
const db = require('../../src/models');
const Op = db.Sequelize.Op;
const { SOURCE } = require('../../src/constants');
const { getExistingData } = require('../../src/services/scrapedDataResult');
const mapAndSave = require('../../src/services/mappingsToSyrfDB/mapTracTracToSyrf');

(async () => {
  const limit = 10;
  let page = 0;
  let shouldContinue = true;
  const existingData = await getExistingData(SOURCE.TRACTRAC);

  while (shouldContinue) {
    const events = await db.tractracEvent.findAll({
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
          TracTracEvent: [event],
        };
        const races = await db.tractracRace.findAll({
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

          const boats = await db.tractracCompetitor.findAll(raceFilter);

          if (boats.length === 0) {
            console.log(
              `Race original id ${race.original_id} does not have participating boats. Skipping`,
            );
            continue;
          }

          const boatPositions = await db.tractracCompetitorPosition.findAll(
            raceFilter,
          );

          if (boatPositions.length === 0) {
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

          const controls = await db.tractracControl.findAll(raceFilter);
          const controlPoints = await db.tractracControlPoint.findAll(
            raceFilter,
          );
          const cpPositions = await db.tractracControlPointPosition.findAll(
            raceFilter,
          );
          const results = await db.tractracCompetitorResult.findAll(raceFilter);
          const passings = await db.tractracCompetitorPassing.findAll(
            raceFilter,
          );

          objectToPass.TracTracRace = [race];
          objectToPass.TracTracCompetitor = boats;
          objectToPass.TracTracCompetitorPosition = boatPositions;
          objectToPass.TracTracControl = controls;
          objectToPass.TracTracControlPoint = controlPoints;
          objectToPass.TracTracControlPointPosition = cpPositions;
          objectToPass.TracTracCompetitorResult = results;
          objectToPass.TracTracCompetitorPassing = passings;

          try {
            console.log(`Saving to syrf DB for race ${race.original_id}`);
            await mapAndSave(objectToPass, raceMetadata);
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

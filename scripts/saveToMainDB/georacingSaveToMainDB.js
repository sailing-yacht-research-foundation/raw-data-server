require('dotenv').config();
const db = require('../../src/models');
const Op = db.Sequelize.Op;
const { SOURCE } = require('../../src/constants');
const { getExistingData } = require('../../src/services/scrapedDataResult');
const mapAndSave = require('../../src/services/mappingsToSyrfDB/mapGeoracingToSyrf');

(async () => {
  const limit = 10;
  let page = 0;
  let shouldContinue = true;
  const existingData = await getExistingData(SOURCE.GEORACING);

  while (shouldContinue) {
    const events = await db.georacingEvent.findAll({
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
          GeoracingEvent: [event],
        };
        const races = await db.georacingRace.findAll({
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

          const boats = await db.georacingActor.findAll(raceFilter);

          if (boats.length === 0) {
            console.log(
              `Race original id ${race.original_id} does not have participating boats. Skipping`,
            );
            continue;
          }

          const boatPositions = await db.georacingPosition.findAll(raceFilter);

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

          const courses = await db.georacingCourse.findAll(raceFilter);
          const courseElements = await db.georacingCourseElement.findAll(raceFilter);
          const courseObjects = await db.georacingCourseObject.findAll(raceFilter);
          const lines = await db.georacingLine.findAll(raceFilter);
          const splittimes = await db.georacingSplittime.findAll(raceFilter);
          const splittimeObjects = await db.georacingSplittimeObject.findAll({
            where: {
              splittime: splittimes.map((s) => s.id),
            },
          });

          objectToPass.GeoracingRace = [race];
          objectToPass.GeoracingActor = boats;
          objectToPass.GeoracingPosition = boatPositions;
          objectToPass.GeoracingCourse = courses;
          objectToPass.GeoracingCourseElement = courseElements;
          objectToPass.GeoracingCourseObject = courseObjects;
          objectToPass.GeoracingLine = lines;
          objectToPass.GeoracingSplittime = splittimes;
          objectToPass.GeoracingSplittimeObject = splittimeObjects;

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

require('dotenv').config();
const db = require('../../src/models');
const Op = db.Sequelize.Op;
const { SOURCE } = require('../../src/constants');
const { getExistingData } = require('../../src/services/scrapedDataResult');
const mapAndSave = require('../../src/services/mappingsToSyrfDB/mapIsailToSyrf');

(async () => {
  const limit = 10;
  let page = 0;
  let shouldContinue = true;
  const existingData = await getExistingData(SOURCE.ISAIL);

  while (shouldContinue) {
    const events = await db.iSailEvent.findAll({
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
        console.log(`Processing event original id ${event.original_id}`);
        const objectToPass = {
          iSailEvent: [event],
        };
        const races = await db.iSailRace.findAll({
          where: {
            event: event.id,
            original_id: {
              [Op.notIn]: existingData.map((d) => d.original_id),
            },
          },
          raw: true,
        });

        const eventFilter = {
          where: {
            event: event.id,
          },
          raw: true,
        };
        const boats = await db.iSailEventParticipant.findAll(eventFilter);
        if (boats.length === 0) {
          console.log(
            `Event original id ${event.original_id} does not have participating boats. Skipping`,
          );
          continue;
        }
        objectToPass.iSailEventParticipant = boats;

        const boatPositions = await db.iSailPosition.findAll(eventFilter);
        if (boatPositions.length === 0) {
          console.log(
            `Event original id ${event.original_id} does not have boat positions. Skipping`,
          );
          continue;
        }
        objectToPass.iSailPosition = boatPositions;

        const tracks = await db.iSailTrack.findAll(eventFilter);
        if (tracks.length === 0) {
          console.log(
            `Event original id ${event.original_id} does not have tracks. Skipping`,
          );
          continue;
        }
        objectToPass.iSailTrack = tracks;

        const roundings = await db.iSailRounding.findAll(eventFilter);
        objectToPass.iSailRounding = roundings;

        console.log(`Processing ${races.length} races`);
        for (const race of races) {
          console.log(`Processing race original id ${race.original_id}`);
          const raceFilter = {
            where: {
              race: race.id,
            },
            raw: true,
          };

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

          const courseMarks = await db.iSailCourseMark.findAll(raceFilter);
          const marks = await db.iSailMark.findAll(raceFilter);
          const results = await db.iSailResult.findAll(raceFilter);
          const startlines = await db.iSailStartline.findAll(raceFilter);

          objectToPass.iSailRace = [race];
          objectToPass.iSailCourseMark = courseMarks;
          objectToPass.iSailMark = marks;
          objectToPass.iSailResult = results;
          objectToPass.iSailStartline = startlines;

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

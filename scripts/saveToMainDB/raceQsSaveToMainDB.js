require('dotenv').config();
const db = require('../../src/models');
const Op = db.Sequelize.Op;
const { SOURCE } = require('../../src/constants');
const { getExistingData } = require('../../src/services/scrapedDataResult');
const mapRaceQsToSyrf = require('../../src/services/mappingsToSyrfDB/mapRaceQsToSyrf');

(async () => {
  const limit = 10;
  let page = 0;
  let shouldContinue = true;
  const existingData = await getExistingData(SOURCE.RACEQS);

  // const existingOriginalIds = new Set(existingData.map((t) => t.original_id));
  // while (shouldContinue) {
  //   // TODO: get all race qs event
  //   const raceQsEvents = await db.raceQsEvent.findAll({
  //     raw: true,
  //     limit,
  //     offset: page * limit,
  //     order: [['original_id', 'ASC']],
  //     where: {
  //       original_id: {
  //         [Op.notIn]: existingData.map((d) => d.original_id),
  //       },
  //     },
  //   });
  //   if (raceQsEvents.length === 0) {
  //     shouldContinue = false;
  //     break;
  //   }

  //   console.log(`Processing ${raceQsEvents.length} regattas`);
  //   for (const raceQsEvent of raceQsEvents) {
  //     // DELETE the index by race qs event
  //     try {
  //       const raceQsRegaData = await db.raceQsRegatta.findAll({
  //         where: {
  //           regatta: raceQsEvent.regatta,
  //         },
  //         raw: true,
  //       });

  //       const eventFilter = {
  //         where: {
  //           event: raceQsEvent.id,
  //         },
  //         raw: true,
  //       };
  //       const raceQsPosition = await raceQsDivision.findAll(eventFilter);
  //       const raceQsDivision = await db.raceQsDivision.findAll(eventFilter);
  //       const raceQsParticipant = await db.raceQsParticipant.findAll(
  //         eventFilter,
  //       );
  //       const raceQsRoute = await db.raceQsRoute.findAll(eventFilter);
  //       const raceQsStart = await db.raceQsStart.findAll(eventFilter);
  //       const raceQsWaypoint = await db.raceQsWaypoint.findAll(eventFilter);

  //       const objectToPass = {
  //         RaceQsEvent: [raceQsEvent],
  //         RaceQsRegatta: raceQsRegaData,
  //         RaceQsPosition: raceQsPosition,
  //         RaceQsDivision: raceQsDivision,
  //         RaceQsParticipant: raceQsParticipant,
  //         raceQsRoute: raceQsRoute,
  //         RaceQsStart: raceQsStart,
  //         RaceQsWaypoint: raceQsWaypoint,
  //       };

  //       console.log(`Processing ${races.length} races`);
  //       for (const race of races) {
  //         const raceFilter = {
  //           where: {
  //             race: race.id,
  //           },
  //           raw: true,
  //         };

  //         const boats = await db.kwindooBoat.findAll(raceFilter);

  //         if (boats.length === 0) {
  //           console.log(
  //             `Race original id ${race.original_id} does not have participating boats. Skipping`,
  //           );
  //           continue;
  //         }

  //         const boatPositions = await db.kwindooPosition.findAll(raceFilter);

  //         if (boatPositions.length === 0) {
  //           console.log(
  //             `Race original id ${race.original_id} does not have boat positions. Skipping`,
  //           );
  //           continue;
  //         }

  //         const waypoints = await db.kwindooWaypoint.findAll(raceFilter);

  //         const raceMetadatas = await db.readyAboutRaceMetadata.findAll({
  //           where: {
  //             id: race.id,
  //           },
  //           raw: true,
  //         });

  //         objectToPass.KwindooRace = [race];
  //         objectToPass.KwindooBoat = boats;
  //         objectToPass.KwindooPosition = boatPositions;
  //         objectToPass.KwindooWaypoint = waypoints;

  //         try {
  //           console.log(`Saving to syrf DB for race ${race.original_id}`);
  //           await mapRaceQsToSyrf(objectToPass, raceMetadatas);
  //           console.log('Finished saving race');
  //         } catch (err) {
  //           console.log('Failed saving to syrf main DB', err);
  //         }
  //       } // race loop
  //     } catch (err) {
  //       console.log('Error occured getting regatta data', err);
  //     }
  //   }
  //   console.log(`Finished processing ${regattas.length} regattas`);
  //   page++;
  // }
  console.log('Finished saving all scraper db data to main db');
})();

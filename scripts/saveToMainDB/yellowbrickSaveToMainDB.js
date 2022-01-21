require('dotenv').config();
const db = require('../../src/models');
const Op = db.Sequelize.Op;
const { SOURCE } = require('../../src/constants');
const { getExistingData } = require('../../src/services/scrapedDataResult');
const mapAndSave = require('../../src/services/mappingsToSyrfDB/mapYellowBrickToSyrf');

(async () => {
  const limit = 10;
  let page = 0;
  let shouldContinue = true;
  const existingData = await getExistingData(SOURCE.YELLOWBRICK);

  while (shouldContinue) {
    const races = await db.yellowbrickRace.findAll({
      where: {
        race_code: {
          [Op.notIn]: existingData.map((d) => d.original_id),
        },
      },
      raw: true,
      limit,
      offset: page * limit,
      order: [['race_code', 'ASC']],
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

        const boats = await db.yellowbrickTeam.findAll(raceFilter);

        if (boats.length === 0) {
          console.log(
            `Race original id ${race.race_code} does not have participating boats. Skipping`,
          );
          continue;
        }

        const positions = await db.yellowbrickPosition.findAll(raceFilter);

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

        const courseNodes = await db.yellowbrickCourseNode.findAll(raceFilter);
        const leaderboardTeams = await db.yellowbrickLeaderboardTeam.findAll(
          raceFilter,
        );
        const pois = await db.yellowbrickPoi.findAll(raceFilter);
        const tags = await db.yellowbrickTag.findAll(raceFilter);

        const objectToPass = {
          YellowbrickRace: [race],
          YellowbrickTeam: boats,
          YellowbrickPosition: positions,
          YellowbrickCourseNode: courseNodes,
          YellowbrickLeaderboardTeam: leaderboardTeams,
          YellowbrickPoi: pois,
          YellowbrickTag: tags,
        };

        try {
          console.log(
            `Saving to syrf DB for race original id ${race.race_code}`,
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

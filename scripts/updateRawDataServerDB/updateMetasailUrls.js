require('dotenv').config();
const db = require('../../src/models');
const elasticsearch = require('../../src/utils/elasticsearch');
const Op = db.Sequelize.Op;
const { SOURCE } = require('../../src/constants');
(async () => {
  console.log('Start updateMetasailUrls script');
  const existingRaces = await db.metasailRace.findAll({
    attributes: ['id', 'url'],
    raw: true,
  });

  console.log(
    `update existingRaces, there are ${existingRaces.length} races in the database`,
  );
  for (const race of existingRaces) {
    let transaction;
    try {
      const url = race.url.replace('http://', 'https://');

      // only update http race
      if (race.url.indexOf('https') === -1) {
        transaction = await db.sequelize.transaction();
        await db.metasailRace.update(
          {
            url,
          },
          {
            where: {
              id: race.id,
            },
            transaction,
          },
        );
        await transaction.commit();
      }
      await elasticsearch.updateRace(race.id, {
        url,
      });
    } catch (error) {
      console.log(error.toString());
      if (transaction) {
        await transaction.rollback();
      }
    }
  }

  const existingMetaDatas = await db.readyAboutRaceMetadata.findAll({
    attributes: ['id', 'url'],
    raw: true,
    where: {
      source: {
        [Op.eq]: SOURCE.METASAIL,
      },
      url: {
        [Op.notILike]: 'https%',
      },
    },
  });

  console.log(
    `update existingMetaDatas, there are ${existingMetaDatas.length} metadatas in the database`,
  );
  for (const data of existingMetaDatas) {
    const transaction = await db.sequelize.transaction();
    try {
      const url = data.url.replace('http', 'https');
      await db.readyAboutRaceMetadata.update(
        {
          url,
        },
        {
          where: {
            id: data.id,
          },
          transaction,
        },
      );
      await transaction.commit();
    } catch (error) {
      console.log(error.toString());
      await transaction.rollback();
    }
  }

  console.log('Finish updateMetasailUrls script');
})();

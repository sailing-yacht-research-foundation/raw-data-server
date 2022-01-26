const db = require('../../src/models');
const databaseErrorHandler = require('../../src/utils/databaseErrorHandler');
const elasticsearch = require('../../src/utils/elasticsearch');
const Op = db.Sequelize.Op;
const { SOURCE } = require('../../src/constants');
const updateMetasailUrls = async () => {
  let errorMessage = '';
  const existingRaces = await db.metasailRace.findAll({
    attributes: ['id', 'url'],
    raw: true,
  });

  for (const race of existingRaces) {
    const transaction = await db.sequelize.transaction();
    try {
      const url = race.url.replace('http://', 'https://');

      // only update http race
      if (race.url.indexOf('https') === -1) {
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
      await transaction.rollback();
      errorMessage = databaseErrorHandler(error);
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
      errorMessage = databaseErrorHandler(error);
    }
  }

  return errorMessage;
};

module.exports = updateMetasailUrls;

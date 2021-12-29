const db = require('../../src/models');
const databaseErrorHandler = require('../../src/utils/databaseErrorHandler');
const elasticsearch = require('../../src/utils/elasticsearch');
const Op = db.Sequelize.Op;

const updateMetasailUrls = async () => {
  let errorMessage = '';
  const existingRaces = await db.metasailRace.findAll({
    attributes: ['id', 'url'],
    raw: true,
    where: {
      url: {
        [Op.notILike]: 'https%',
      },
    },
  });
  if (existingRaces.length === 0) {
    return;
  }

  for (const race of existingRaces) {
    const transaction = await db.sequelize.transaction();
    try {
      const url = race.url.replace('http', 'https');
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
      await elasticsearch.updateRace(race.id, {
        url,
      });
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

const db = require('../../models');
const databaseErrorHandler = require('../../utils/databaseErrorHandler');
const elasticsearch = require('../../utils/elasticsearch');

const updateMetasailUrls = async () => {
  const transaction = await db.sequelize.transaction();
  let errorMessage = '';
  try {
    const existingRaces = await db.metasailRace.findAll({
      attributes: ['id', 'url'],
      raw: true,
    });
    if (existingRaces.length === 0) {
      return;
    }
    for (const race of existingRaces) {
      if (race.url.indexOf('https') !== -1) {
        continue;
      }
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
    }
    await transaction.commit();
  } catch (error) {
    console.log(error.toString());
    await transaction.rollback();
    errorMessage = databaseErrorHandler(error);
  }

  return errorMessage;
};

module.exports = updateMetasailUrls;

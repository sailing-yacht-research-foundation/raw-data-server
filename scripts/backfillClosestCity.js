require('dotenv').config();
const db = require('../src/models');
const elasticsearch = require('../src/utils/elasticsearch');
const Op = db.Sequelize.Op;

const { pointToCity } = require('../src/utils/gisUtils');

(async () => {
  let page = 1;
  const perPage = 10;

  let shouldContinue = true;
  const failedIds = [];
  do {
    const data = await db.readyAboutRaceMetadata.findAll({
      where: { start_city: null, id: { [Op.notIn]: failedIds } },
      raw: true,
      offset: (page - 1) * perPage,
      limit: perPage,
      order: [['approx_start_time_ms', 'DESC']],
    });

    if (data.length > 0) {
      for (let i = 0; i < data.length; i++) {
        const transaction = await db.sequelize.transaction();
        const { id, approx_start_point: startPoint } = data[i];
        try {
          const closestCity = pointToCity(startPoint.coordinates);
          await db.readyAboutRaceMetadata.update(
            { start_city: closestCity },
            { where: { id }, transaction },
          );
          await elasticsearch.updateRace(id, {
            start_city: closestCity,
          });
          await transaction.commit();
        } catch (error) {
          console.error('Failed updating:', error.message);
          failedIds.push(id);
          await transaction.rollback();
        }
      }
      console.log('Done updating:', data.map((row) => row.id).join(', '));
    } else {
      shouldContinue = false;
    }
    page++;
  } while (shouldContinue);
  console.log('Finished at page: ', page - 1);
})();

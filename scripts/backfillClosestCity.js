require('dotenv').config();
const db = require('../src/models');
const elasticsearch = require('../src/utils/elasticsearch');
const Op = db.Sequelize.Op;

const { pointToCity } = require('../src/utils/gisUtils');

(async () => {
  let shouldContinue = true;
  const failedIds = [];
  do {
    const data = await db.readyAboutRaceMetadata.findAll({
      attributes: ['id', 'approx_start_point'],
      where: { start_city: null, id: { [Op.notIn]: failedIds } },
      raw: true,
      limit: 10,
      order: [['approx_start_time_ms', 'DESC']],
    });

    console.log(`Retrieved ${data.length} records`);
    if (data.length > 0) {
      for (let i = 0; i < data.length; i++) {
        const { id, approx_start_point: startPoint } = data[i];
        let closestCity;
        try {
          closestCity = pointToCity(startPoint.coordinates);
          await db.readyAboutRaceMetadata.update(
            { start_city: closestCity },
            { where: { id } },
          );
        } catch (error) {
          console.error(`Failed updating metadata ${id}:`, error);
          failedIds.push(id);
        }

        try {
          await elasticsearch.updateRace(id, {
            start_city: closestCity,
          });
        } catch (error) {
          console.error(`Failed updating elastic search ${id}:`, error);
        }
      }
      console.log('Done updating:', data.map((row) => row.id).join(', '));
    } else {
      shouldContinue = false;
    }
  } while (shouldContinue);
  console.log('Finished backfilling start_city');
})();

require('dotenv').config();
const db = require('../src/models');
const elasticsearch = require('../src/utils/elasticsearch');

const { pointToCity } = require('../src/utils/gisUtils');

(async () => {
  let page = 1;
  const perPage = 5;

  let shouldContinue = true;
  do {
    const data = await db.readyAboutRaceMetadata.findAll({
      where: { start_city: null },
      raw: true,
      offset: (page - 1) * perPage,
      limit: perPage,
      order: [['approx_start_time_ms', 'DESC']],
    });

    if (data.length > 0) {
      for (let i = 0; i < data.length; i++) {
        try {
          const { id, approx_start_point: startPoint } = data[i];
          const closestCity = pointToCity(startPoint.coordinates);
          await db.readyAboutRaceMetadata.update(
            { start_city: closestCity },
            { where: { id } },
          );
          await elasticsearch.updateRace(id, {
            start_city: closestCity,
          });
        } catch (error) {
          console.error('Failed updating:', error.message);
          shouldContinue = false;
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

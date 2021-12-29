require('dotenv').config();
const db = require('../src/models');
const elasticsearch = require('../src/utils/elasticsearch');
const Op = db.Sequelize.Op;

const { getCountryAndCity } = require('../src/utils/gisUtils.js');

(async () => {
  let shouldContinue = true;
  const failedIds = [];
  do {
    const data = await db.readyAboutRaceMetadata.findAll({
      attributes: ['id', 'approx_start_point'],
      where: {
        [Op.or]: [{ start_city: '' }, { start_city: null }],
        id: { [Op.notIn]: failedIds }
      },
      raw: true,
      limit: 10,
      order: [['approx_start_time_ms', 'DESC']],
    });

    console.log(`Retrieved ${data.length} records`);
    if (data.length > 0) {
      for (let i = 0; i < data.length; i++) {
        const { id, approx_start_point: startPoint } = data[i];

        let countryName, cityName;
        try {
          ({ countryName, cityName } = await getCountryAndCity({
            lon: startPoint.coordinates[0],
            lat: startPoint.coordinates[1],
          }));
        } catch (error) {
          console.log('Failed getting country and city', error);
          failedIds.push(id);
          continue;
        }

        if (!countryName || !cityName) {
          console.log(
            `No country or city found for id ${id}. country=${countryName}, city=${cityName}`,
          );
          failedIds.push(id);
          continue;
        }
        try {
          await db.readyAboutRaceMetadata.update(
            { start_country: countryName, start_city: cityName },
            { where: { id } },
          );
        } catch (error) {
          console.error(`Failed updating metadata ${id}:`, error);
          failedIds.push(id);
          continue;
        }

        try {
          await elasticsearch.updateRace(id, {
            start_country: countryName,
            start_city: cityName,
          });
        } catch (error) {
          if (error.response.status === 404 || error.status === 404) {
            console.log('Elastic search race not found');
          } else {
            console.error(`Failed updating elastic search ${id}:`, error);
          }
        }
      }
      console.log('Done updating:', data.map((row) => row.id).join(', '));
    } else {
      shouldContinue = false;
    }
  } while (shouldContinue);
  console.log('Finished backfilling start_city');
})();

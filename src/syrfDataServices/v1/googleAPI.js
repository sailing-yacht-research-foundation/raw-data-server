const axios = require('axios');
const qs = require('qs');

const GOOGLE_MAP_URL = 'https://maps.googleapis.com';

exports.reverseGeoCode = async ({ lon, lat }) => {
  let query = qs.stringify({
    latlng: `${lat},${lon}`,
    key: process.env.GOOGLE_MAP_API_KEY,
  });
  let countryName = '';
  let countryCode = '';
  let stateName = '';
  let cityName = '';
  try {
    const response = await axios.get(
      `${GOOGLE_MAP_URL}/maps/api/geocode/json?${query}`,
    );
    let { results } = response.data;
    if (results.length <= 0) {
      throw new Error('Location Not Found');
    }
    let { address_components: addressComponent } = results[0];
    // In Indonesia, administrative_area_level_2 is the city
    // In Sweden, postal_town is the city.
    // In Hongkong, administrative_area_level_1 is the city
    const cityPriority = [
      'locality',
      'administrative_area_level_2',
      'postal_town',
      'administrative_area_level_1',
    ];
    addressComponent.forEach((component) => {
      let { types, short_name: shortName, long_name: longName } = component;
      if (types.includes('country')) {
        countryName = longName;
        countryCode = shortName;
      }
      if (types.includes('administrative_area_level_1')) {
        stateName = longName;
      }
    });

    cityPriority.some((type) => {
      const city = addressComponent.find((ac) => ac.types.includes(type));
      cityName = city?.long_name || '';
      return !!cityName;
    });
  } catch (error) {
    console.log(error);
  }

  return {
    countryCode,
    countryName,
    stateName,
    cityName,
  };
};

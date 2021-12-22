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
    addressComponent.forEach((component) => {
      let { types, short_name: shortName, long_name: longName } = component;
      if (types.includes('country')) {
        countryName = longName;
        countryCode = shortName;
      }
      if (types.includes('administrative_area_level_1')) {
        stateName = longName;
      }
      if (types.includes('locality')) {
        cityName = longName;
      }
      if (!cityName && types.includes('administrative_area_level_2')) {
        // Note: Strangely in Indonesia, there's no locality, and we have administrative area level 2-4
        cityName = longName;
      }
    });
    // This is outside the forEach loop since I'm not sure if the locality and postal_town can exist together
    if (!cityName) {
      // some country like Sweden has town with no city like Uddevalla
      const townAddress = addressComponent.find((ac) =>
        ac.types.includes('postal_town'),
      );
      cityName = townAddress?.long_name || '';
    }
  } catch (error) {
    console.trace(error);
  }

  return {
    countryCode,
    countryName,
    stateName,
    cityName,
  };
};

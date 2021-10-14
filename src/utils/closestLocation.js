const cities = require('all-the-cities');
const fs = require('fs');
const turf = require('@turf/turf');
const KDBush = require('kdbush');
const geokdbush = require('geokdbush');

const world = JSON.parse(
  fs.readFileSync(`${__dirname}/../data/countries.json`, 'utf-8'),
);

const countryList = [];
world.features.forEach((country) => {
  const { ADMIN: countryName } = country.properties;
  const points = turf.explode(country.geometry);
  points.features.forEach((row) => {
    countryList.push({
      countryName,
      lon: row.geometry.coordinates[0],
      lat: row.geometry.coordinates[1],
    });
  });
});
const countryIndex = new KDBush(
  countryList,
  (p) => p.lon,
  (p) => p.lat,
);

const cityIndex = new KDBush(
  cities,
  (p) => p.loc.coordinates[0],
  (p) => p.loc.coordinates[1],
);

exports.findClosestCity = (point) => {
  const nearestCity = geokdbush.around(cityIndex, point[0], point[1], 1);
  return nearestCity[0].name;
};

exports.findClosestCountry = (point) => {
  const nearestCountry = geokdbush.around(countryIndex, point[0], point[1], 1);
  return nearestCountry[0].countryName;
};

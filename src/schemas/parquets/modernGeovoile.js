const parquet = require('parquetjs-lite');

const modernGeovoileCombined = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  legNum: { type: 'INT32' },
  numLegs: { type: 'INT32' },
  name: { type: 'UTF8', optional: true },
  url: { type: 'UTF8' },
  scrapedUrl: { type: 'UTF8' },
  raceState: { type: 'UTF8', optional: true },
  eventState: { type: 'UTF8', optional: true },
  prerace: { type: 'INT32', optional: true },
  startTime: { type: 'INT64' },
  endTime: { type: 'INT64' },
  isGame: { type: 'BOOLEAN', optional: true },
  boats: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'UTF8' },
      race_id: { type: 'UTF8' },
      race_original_id: { type: 'UTF8', optional: true },
      name: { type: 'UTF8' },
      short_name: { type: 'UTF8', optional: true },
      hullColor: { type: 'UTF8', optional: true },
      hulls: { type: 'INT32', optional: true },
    },
    sailors: {
      repeated: true,
      optional: true,
      fields: {
        id: { type: 'UTF8' },
        race_id: { type: 'UTF8' },
        race_original_id: { type: 'UTF8' },
        boat_id: { type: 'UTF8' },
        boat_original_id: { type: 'UTF8' },
        first_name: { type: 'UTF8' },
        last_name: { type: 'UTF8', optional: true },
        short_name: { type: 'UTF8', optional: true },
        nationality: { type: 'UTF8', optional: true },
      },
    },
  },
});

const modernGeovoileBoatPosition = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  race_id: { type: 'UTF8' },
  race_original_id: { type: 'UTF8' },
  boat_id: { type: 'UTF8' },
  boat_original_id: { type: 'UTF8' },
  command: { type: 'UTF8', optional: true },
  crossing_antimeridian: { type: 'BOOLEAN', optional: true },
  dt_a: { type: 'DOUBLE', optional: true },
  dt_b: { type: 'DOUBLE', optional: true },
  heading: { type: 'DOUBLE', optional: true },
  lat: { type: 'DOUBLE', optional: true },
  lon: { type: 'DOUBLE', optional: true },
  timecode: { type: 'INT64', optional: true },
  d_lat: { type: 'DOUBLE', optional: true },
  d_lon: { type: 'DOUBLE', optional: true },
});

module.exports = {
  modernGeovoileCombined,
  modernGeovoileBoatPosition,
};

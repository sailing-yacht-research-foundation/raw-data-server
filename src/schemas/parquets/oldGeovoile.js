const parquet = require('parquetjs-lite');

const oldGeovoileCombined = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  url: { type: 'UTF8' },
  name: { type: 'UTF8' },
  start_time: { type: 'UTF8' },
  boats: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'UTF8' },
      race_id: { type: 'UTF8' },
      class: { type: 'UTF8', optional: true },
      alt: { type: 'UTF8', optional: true },
      q: { type: 'UTF8', optional: true },
      name: { type: 'UTF8', optional: true },
      boatOrSponsor: { type: 'UTF8', optional: true },
      arrival: { type: 'UTF8', optional: true },
      durationOrRetired: { type: 'UTF8', optional: true },
    },
  },
});

const oldGeovoileBoatPosition = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  race_id: { type: 'UTF8' },
  boat_id: { type: 'UTF8' },
  boat_original_id: { type: 'UTF8' },
  lat: { type: 'DOUBLE' },
  lon: { type: 'DOUBLE' },
  timestamp: { type: 'INT64' },
});

module.exports = {
  oldGeovoileCombined,
  oldGeovoileBoatPosition,
};

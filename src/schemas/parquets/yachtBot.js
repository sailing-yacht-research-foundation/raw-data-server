var parquet = require('parquetjs-lite');

const yachtbotPosition = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  race: { type: 'UTF8' },
  race_original_id: { type: 'UTF8' },
  yacht_or_buoy: { type: 'UTF8' },
  yacht: { type: 'UTF8', optional: true },
  yacht_original_id: { type: 'UTF8', optional: true },
  buoy: { type: 'UTF8', optional: true },
  buoy_original_id: { type: 'UTF8', optional: true },
  time: { type: 'INT64', optional: true },
  lat: { type: 'UTF8', optional: true },
  lon: { type: 'UTF8', optional: true },
  gps_quality: { type: 'UTF8', optional: true },
});
const yachtbotCombined = new parquet.ParquetSchema({
  race_id: { type: 'UTF8' },
  race_original_id: { type: 'UTF8' },
  name: { type: 'UTF8' },
  start_time: { type: 'UTF8', optional: true },
  end_time: { type: 'UTF8', optional: true },
  manual_wind: { type: 'UTF8', optional: true },
  course_direction: { type: 'UTF8', optional: true },
  url: { type: 'UTF8', optional: true },
  buoys: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'UTF8' },
      race: { type: 'UTF8' },
      race_original_id: { type: 'UTF8' },
      name: { type: 'UTF8', optional: true },
      buoy_type: { type: 'UTF8', optional: true },
      connected_buoy: { type: 'UTF8', optional: true },
      connected_buoy_original_id: { type: 'UTF8', optional: true },
      metas: { type: 'UTF8', optional: true },
    },
  },
  yachts: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'UTF8' },
      race: { type: 'UTF8' },
      race_original_id: { type: 'UTF8' },
      name: { type: 'UTF8', optional: true },
      boat_number: { type: 'UTF8', optional: true },
      crew: { type: 'UTF8', optional: true },
      country: { type: 'UTF8', optional: true },
      metas: { type: 'UTF8', optional: true },
    },
  },
});

module.exports = {
  yachtbotPosition,
  yachtbotCombined,
};

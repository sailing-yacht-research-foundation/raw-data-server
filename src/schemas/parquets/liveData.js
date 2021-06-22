var parquet = require('parquetjs-lite');

const liveDataSchema = new parquet.ParquetSchema({
  race_unit_id: { type: 'UTF8' },
  // TODO: Add details when Data is ready/available
  data_points: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      lat: { type: 'UTF8' },
      lon: { type: 'UTF8' },
      speed: { type: 'DOUBLE' },
      heading: { type: 'DOUBLE' },
      accuracy: { type: 'DOUBLE' },
      altitude: { type: 'DOUBLE' },
      at: { type: 'INT64' },
      tws: { type: 'DOUBLE' },
      twa: { type: 'DOUBLE' },
      stw: { type: 'DOUBLE' },
      boat_participant_group_id: { type: 'UTF8', optional: true },
      boat_id: { type: 'UTF8', optional: true },
      device_id: { type: 'UTF8', optional: true },
      description: { type: 'UTF8', optional: true },
      user_id: { type: 'UTF8', optional: true },
      public_id: { type: 'UTF8', optional: true },
    },
  },
  // TODO: Update more data here (boats, devices) once ready
});

module.exports = {
  liveDataSchema,
};

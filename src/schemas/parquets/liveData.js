var parquet = require('parquetjs-lite');

const liveData = new parquet.ParquetSchema({
  race_id: { type: 'UTF8' },
  // TODO: Update this once Data is ready/available
  race_data: { type: 'UTF8', optional: true },
  data_points: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      lat: { type: 'UTF8' },
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
  liveData,
};

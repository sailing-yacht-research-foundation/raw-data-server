const parquet = require('parquetjs-lite');

const americasCupPosition = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  boat_name: { type: 'UTF8' },
  boat: { type: 'UTF8' },
  boat_original_id: { type: 'UTF8' },
  boat_type: { type: 'UTF8' },
  date: { type: 'UTF8' },
  secs: { type: 'UTF8' },
  local_time: { type: 'UTF8' },
  zone: { type: 'UTF8' },
  timestamp: { type: 'DOUBLE' },
  lat: { type: 'UTF8' },
  lon: { type: 'UTF8' },
  hdg: { type: 'UTF8' },
  heel: { type: 'UTF8' },
  pitch: { type: 'UTF8' },
  cog: { type: 'UTF8' },
  sog: { type: 'UTF8' },
  course_wind_direction: { type: 'UTF8' },
  course_wind_speed: { type: 'UTF8' },
  y_hdg: { type: 'UTF8' },
  y_speed: { type: 'UTF8' },
  y_tws: { type: 'UTF8' },
  y_twd: { type: 'UTF8' },
  y_aws: { type: 'UTF8' },
  y_awa: { type: 'UTF8' },
  y_twa: { type: 'UTF8' },
  y_sog: { type: 'UTF8' },
  y_cog: { type: 'UTF8' },
  y_rudder: { type: 'UTF8' },
  filename: { type: 'UTF8' },
});

const americasCupAvgWind = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  date: { type: 'UTF8' },
  secs: { type: 'UTF8' },
  local_time: { type: 'UTF8' },
  zone: { type: 'UTF8' },
  timestamp: { type: 'DOUBLE' },
  instant: { type: 'UTF8' },
  average: { type: 'UTF8' },
  filename: { type: 'UTF8' },
});

const americasCupBoat = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  shape_original_id: { type: 'UTF8' },
  type: { type: 'UTF8' },
  ack: { type: 'UTF8' },
  ip_address: { type: 'UTF8', optional: true },
  stowe_name: { type: 'UTF8', optional: true },
  short_name: { type: 'UTF8', optional: true },
  shorter_name: { type: 'UTF8', optional: true },
  boat_name: { type: 'UTF8' },
  hull_num: { type: 'UTF8', optional: true },
  skipper: { type: 'UTF8', optional: true },
  flag: { type: 'UTF8', optional: true },
  peli_id: { type: 'UTF8', optional: true },
  radio_ip: { type: 'UTF8', optional: true },
});

const americasCupBoatShape = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  seq: { type: 'UTF8' },
  y: { type: 'UTF8' },
  x: { type: 'UTF8' },
});

const americasCupRegatta = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  name: { type: 'UTF8', optional: true },
  course_name: { type: 'UTF8', optional: true },
  central_lat: { type: 'UTF8', optional: true },
  central_lon: { type: 'UTF8', optional: true },
  central_altitude: { type: 'UTF8', optional: true },
  utc_offset: { type: 'UTF8', optional: true },
  magnetic_variation: { type: 'UTF8', optional: true },
  shoreline_name: { type: 'UTF8', optional: true },
});

const americasCupCombined = new parquet.ParquetSchema({
  race_id: { type: 'UTF8' },
  race_original_id: { type: 'UTF8' },
  type: { type: 'UTF8' },
  name: { type: 'UTF8', optional: true },
  start_time: { type: 'UTF8' },
  postpone: { type: 'UTF8' },
  creation_time_date: { type: 'UTF8' },
  regatta: { type: 'UTF8' },
  regatta_original_id: { type: 'UTF8' },
  participants: { type: 'UTF8' },
  compound_marks: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'UTF8' },
      seq_id: { type: 'UTF8', optional: true },
      name: { type: 'UTF8', optional: true },
      rounding: { type: 'UTF8', optional: true },
      zone_size: { type: 'UTF8', optional: true },
    },
  },
  course_limits: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      seq_id: { type: 'UTF8' },
      lat: { type: 'UTF8' },
      lon: { type: 'UTF8' },
      time_created: { type: 'UTF8' },
    },
  },
  events: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      boat_name: { type: 'UTF8', optional: true },
      date: { type: 'UTF8' },
      secs: { type: 'UTF8' },
      local_time: { type: 'UTF8' },
      zone: { type: 'UTF8' },
      timestamp: { type: 'DOUBLE' },
      event: { type: 'UTF8', optional: true },
      opt1: { type: 'UTF8', optional: true },
      opt2: { type: 'UTF8', optional: true },
      filename: { type: 'UTF8' },
    },
  },
  marks: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'UTF8' },
      compound_mark: { type: 'UTF8' },
      compound_mark_original_id: { type: 'UTF8' },
      seq_id: { type: 'UTF8', optional: true },
      name: { type: 'UTF8', optional: true },
      lat: { type: 'UTF8' },
      lon: { type: 'UTF8' },
    },
  },
});

module.exports = {
  americasCupPosition,
  americasCupAvgWind,
  americasCupBoat,
  americasCupBoatShape,
  americasCupRegatta,
  americasCupCombined,
};
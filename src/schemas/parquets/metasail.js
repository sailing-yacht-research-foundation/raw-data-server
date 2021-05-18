var parquet = require('parquetjs-lite');

const metasailBoat = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8', optional: true },
  race: { type: 'UTF8', optional: true },
  race_original_id: { type: 'UTF8', optional: true },
  serial: { type: 'UTF8', optional: true },
  name: { type: 'UTF8', optional: true },
  description: { type: 'UTF8', optional: true },
  sail_number: { type: 'UTF8', optional: true },
  is_dummy: { type: 'BOOLEAN', optional: true },
});

const metasailBuoy = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  race: { type: 'UTF8' },
  race_original_id: { type: 'UTF8' },
  name: { type: 'UTF8' },
  initials: { type: 'UTF8', optional: true },
  description: { type: 'UTF8', optional: true },
  lat: { type: 'UTF8', optional: true },
  lon: { type: 'UTF8', optional: true },
  lat_m: { type: 'UTF8', optional: true },
  lon_m: { type: 'UTF8', optional: true },
});

const metasailGate = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  race: { type: 'UTF8' },
  race_original_id: { type: 'UTF8' },
  buoy_1: { type: 'UTF8' },
  buoy_1_original_id: { type: 'UTF8' },
  buoy_2: { type: 'UTF8' },
  buoy_2_original_id: { type: 'UTF8' },
});

const metasailEvent = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  name: { type: 'UTF8', optional: true },
  external_website: { type: 'UTF8', optional: true },
  url: { type: 'UTF8' },
  category_text: { type: 'UTF8', optional: true },
  start: { type: 'UTF8', optional: true },
  end: { type: 'UTF8', optional: true },
});

const metasailRace = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  event: { type: 'UTF8', optional: true },
  event_original_id: { type: 'UTF8', optional: true },
  name: { type: 'UTF8', optional: true },
  start: { type: 'TIMESTAMP_MILLIS', optional: true },
  stop: { type: 'TIMESTAMP_MILLIS', optional: true },
  url: { type: 'UTF8', optional: true },
  stats: { type: 'UTF8', optional: true },
  passings: { type: 'UTF8', optional: true },
});

const metasailPosition = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  race: { type: 'UTF8' },
  race_original_id: { type: 'UTF8' },
  event: { type: 'UTF8' },
  original_event_id: { type: 'UTF8' },

  boat: { type: 'UTF8', optional: true },
  boat_original_id: { type: 'UTF8', optional: true },
  buoy: { type: 'UTF8', optional: true },
  buoy_original_id: { type: 'UTF8', optional: true },
  time: { type: 'UTF8' },
  lon: { type: 'UTF8' },
  lat: { type: 'UTF8' },
  speed: { type: 'UTF8' },

  lon_metri_const: { type: 'UTF8', optional: true },
  lat_metri_const: { type: 'UTF8', optional: true },
  rank: { type: 'UTF8', optional: true },
  distance_to_first_boat: { type: 'UTF8', optional: true },
  wind_state: { type: 'UTF8', optional: true },
  wind_direction: { type: 'UTF8', optional: true },

  slope_rank_line: { type: 'UTF8', optional: true },
  end_time_difference: { type: 'UTF8', optional: true },
  begin_date_time: { type: 'UTF8', optional: true },
  crt_race_segment: { type: 'UTF8', optional: true },
  apply_wind: { type: 'UTF8', optional: true },
  vmc: { type: 'UTF8', optional: true },
  vmg: { type: 'UTF8', optional: true },
  orientation: { type: 'UTF8', optional: true },
});

module.exports = {
  metasailBoat,
  metasailBuoy,
  metasailGate,
  metasailEvent,
  metasailRace,
  metasailPosition,
};

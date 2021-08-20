var parquet = require('parquetjs-lite');

const swiftsurePosition = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  race: { type: 'UTF8' },
  race_original_id: { type: 'UTF8', optional: true },
  boat: { type: 'UTF8', optional: true },
  boat_original_id: { type: 'UTF8', optional: true },
  timestamp: { type: 'UTF8', optional: true },
  lat: { type: 'UTF8', optional: true },
  lon: { type: 'UTF8', optional: true },
  speed: { type: 'UTF8', optional: true },
  heading: { type: 'UTF8', optional: true },
  stat: { type: 'UTF8', optional: true },
  dtg: { type: 'UTF8', optional: true },
});

const swiftsureCombined = new parquet.ParquetSchema({
  race_id: { type: 'UTF8' },
  race_original_id: { type: 'UTF8' },
  welcome: { type: 'UTF8', optional: true },
  race_start: { type: 'UTF8', optional: true },
  course_bounds_n: { type: 'UTF8', optional: true },
  course_bounds_s: { type: 'UTF8', optional: true },
  course_bounds_e: { type: 'UTF8', optional: true },
  course_bounds_w: { type: 'UTF8', optional: true },
  home_bounds_n: { type: 'UTF8', optional: true },
  home_bounds_s: { type: 'UTF8', optional: true },
  home_bounds_e: { type: 'UTF8', optional: true },
  home_bounds_w: { type: 'UTF8', optional: true },
  fin_bounds_n: { type: 'UTF8', optional: true },
  fin_bounds_s: { type: 'UTF8', optional: true },
  fin_bounds_e: { type: 'UTF8', optional: true },
  fin_bounds_w: { type: 'UTF8', optional: true },
  timezone: { type: 'UTF8', optional: true },
  track_type: { type: 'UTF8', optional: true },
  event_type: { type: 'UTF8', optional: true },
  update_interval: { type: 'UTF8', optional: true },
  tag_interval: { type: 'UTF8', optional: true },
  url: { type: 'UTF8', optional: true },
  default_facebook: { type: 'UTF8', optional: true },
  boats: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'UTF8' },
      boat_name: { type: 'UTF8', optional: true },
      api_2_id: { type: 'UTF8', optional: true },
      team_name: { type: 'UTF8', optional: true },
      division: { type: 'UTF8', optional: true },
      boat_id: { type: 'UTF8', optional: true },
      yacht_club: { type: 'UTF8', optional: true },
      make: { type: 'UTF8', optional: true },
      loa: { type: 'UTF8', optional: true },
      home_port: { type: 'UTF8', optional: true },
      skipper: { type: 'UTF8', optional: true },
      skipper_email: { type: 'UTF8', optional: true },
      fbib: { type: 'UTF8', optional: true },
      race_sort: { type: 'UTF8', optional: true },
      start_time: { type: 'UTF8', optional: true },
      num_crew: { type: 'UTF8', optional: true },
      scoring: { type: 'UTF8', optional: true },
    },
  },
  lines: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'UTF8' },
      name: { type: 'UTF8', optional: true },
      lat1: { type: 'UTF8' },
      lon1: { type: 'UTF8' },
      lat2: { type: 'UTF8' },
      lon2: { type: 'UTF8' },
    },
  },
  links: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'UTF8' },
      name: { type: 'UTF8', optional: true },
      lat: { type: 'UTF8', optional: true },
      lon: { type: 'UTF8', optional: true },
      url: { type: 'UTF8', optional: true },
    },
  },
  marks: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'UTF8' },
      name: { type: 'UTF8', optional: true },
      lat: { type: 'UTF8', optional: true },
      lon: { type: 'UTF8', optional: true },
    },
  },
  points: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'UTF8' },
      name: { type: 'UTF8', optional: true },
      lat: { type: 'UTF8', optional: true },
      lon: { type: 'UTF8', optional: true },
    },
  },
  sponsors: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'UTF8' },
      name: { type: 'UTF8', optional: true },
      lat: { type: 'UTF8', optional: true },
      lon: { type: 'UTF8', optional: true },
      url: { type: 'UTF8', optional: true },
    },
  },
});

module.exports = {
  swiftsurePosition,
  swiftsureCombined,
};
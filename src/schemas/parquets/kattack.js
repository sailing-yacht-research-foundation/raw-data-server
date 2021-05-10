var parquet = require('parquetjs-lite');

const kattackYachtClub = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8', optional: true },
  race: { type: 'UTF8', optional: true },
  external_url: { type: 'UTF8', optional: true },
});

const kattackWaypoint = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8', optional: true },
  race: { type: 'UTF8', optional: true },
  original_race_id: { type: 'UTF8', optional: true },
  html_description: { type: 'UTF8', optional: true },
  name: { type: 'UTF8', optional: true },
  yacht_club: { type: 'UTF8', optional: true },
  original_yacht_club_id: { type: 'UTF8', optional: true },
  lon: { type: 'UTF8', optional: true },
  lat: { type: 'UTF8', optional: true },
  epoch_offset_sec: { type: 'UTF8', optional: true },
});

const kattackPosition = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  device: { type: 'UTF8', optional: true },
  original_device_id: { type: 'UTF8', optional: true },
  race: { type: 'UTF8', optional: true },
  original_race_id: { type: 'UTF8', optional: true },
  lon: { type: 'UTF8', optional: true },
  lat: { type: 'UTF8', optional: true },
  time: { type: 'UTF8', optional: true },
  speed_kts: { type: 'UTF8', optional: true },
  distance_nm: { type: 'UTF8', optional: true },
  heading_deg: { type: 'UTF8', optional: true },
  epoch_offset_sec: { type: 'UTF8', optional: true },
});

const kattackDevice = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  race: { type: 'UTF8', optional: true },
  original_race_id: { type: 'UTF8', optional: true },
  name: { type: 'UTF8', optional: true },
  type: { type: 'UTF8', optional: true },
  lon: { type: 'UTF8', optional: true },
  lat: { type: 'UTF8', optional: true },
  last_course_pt_lon: { type: 'UTF8', optional: true },
  last_course_pt_lat: { type: 'UTF8', optional: true },
  speed_kts: { type: 'UTF8', optional: true },
  heading_deg: { type: 'UTF8', optional: true },
  mode: { type: 'UTF8', optional: true },
  status: { type: 'UTF8', optional: true },
  is_logging: { type: 'UTF8', optional: true },
  is_blocked: { type: 'UTF8', optional: true },
  device_row_id: { type: 'UTF8', optional: true },
  yacht_club: { type: 'UTF8', optional: true },
  original_yacht_club_id: { type: 'UTF8', optional: true },
  shared_device_row_id: { type: 'UTF8', optional: true },
  status_msg: { type: 'UTF8', optional: true },
  device_internal_name: { type: 'UTF8', optional: true },
  epoch_offset_sec: { type: 'UTF8', optional: true },
  elapsed_time_dhms: { type: 'UTF8', optional: true },
  info_html: { type: 'UTF8', optional: true },
  info_html_2: { type: 'UTF8', optional: true },
  js_data_id: { type: 'UTF8', optional: true },

  start_timezone_type: { type: 'UTF8', optional: true },
  start_timezone: { type: 'UTF8', optional: true },
  stop_date: { type: 'TIMESTAMP_MILLIS', optional: true },
  stop_timezone_type: { type: 'UTF8', optional: true },
  stop_timezone: { type: 'UTF8', optional: true },
  club: { type: 'UTF8', optional: true },
  location: { type: 'UTF8', optional: true },
  url: { type: 'UTF8', optional: true },
});

const kattackRace = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8', optional: true },
  name: { type: 'UTF8', optional: true },
  original_paradigm: { type: 'UTF8', optional: true },
  yacht_club: { type: 'UTF8', optional: true },
  original_yacht_club_id: { type: 'UTF8', optional: true },
  original_fleet_id: { type: 'UTF8', optional: true },
  original_series_id: { type: 'UTF8', optional: true },
  original_course_id: { type: 'UTF8', optional: true },
  start: { type: 'INT64', optional: true },
  stop: { type: 'INT64', optional: true },
  days: { type: 'INT64', optional: true },
  sleep_hour: { type: 'UTF8', optional: true },
  wake_hour: { type: 'UTF8', optional: true },
  heartbeat_int_sec: { type: 'UTF8', optional: true },
  wait_samp_int_sec: { type: 'UTF8', optional: true },
  active_samp_int_sec: { type: 'UTF8', optional: true },
  active_pts: { type: 'UTF8', optional: true },
  still_pts: { type: 'UTF8', optional: true },
  still_radius_met: { type: 'UTF8', optional: true },
  upload_int_sec: { type: 'UTF8', optional: true },
  modified_time: { type: 'INT64', optional: true },
  password: { type: 'UTF8', optional: true },
  race_start_time_utc: { type: 'INT64', optional: true },
  feed_start_time_epoch_offset_sec: { type: 'UTF8', optional: true },
  prestart_length_sec: { type: 'UTF8', optional: true },
  race_start_time_epoch_offset_sec: { type: 'INT64', optional: true },
  race_finish_time_epoch_offset_sec: { type: 'INT64', optional: true },
  feed_length_sec: { type: 'INT64', optional: true },
  race_length_sec: { type: 'INT64', optional: true },
  is_distance_race: { type: 'UTF8', optional: true },
  is_open_feed: { type: 'UTF8', optional: true },
  speed_filter_kts: { type: 'UTF8', optional: true },
  is_live: { type: 'UTF8', optional: true },

  has_started: { type: 'UTF8', optional: true },
  lon: { type: 'UTF8', optional: true },
  lat: { type: 'UTF8', optional: true },
  course_heading_deg: { type: 'UTF8', optional: true },
  js_race_feed_id: { type: 'UTF8', optional: true },
  js_race_course_id: { type: 'UTF8', optional: true },
  url: { type: 'UTF8' },
  leaderboard_data: { type: 'UTF8', optional: true },
});
module.exports = {
  kattackYachtClub,
  kattackWaypoint,
  kattackPosition,
  kattackDevice,
  kattackRace,
};

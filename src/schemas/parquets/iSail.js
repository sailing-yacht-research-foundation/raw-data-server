var parquet = require('parquetjs-lite');

const iSailClass = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  name: { type: 'UTF8', optional: true },
});

const iSailEvent = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  name: { type: 'UTF8', optional: true },
  start_date: { type: 'TIMESTAMP_MILLIS', optional: true },
  start_timezone_type: { type: 'UTF8', optional: true },
  start_timezone: { type: 'UTF8', optional: true },
  stop_date: { type: 'TIMESTAMP_MILLIS', optional: true },
  stop_timezone_type: { type: 'UTF8', optional: true },
  stop_timezone: { type: 'UTF8', optional: true },
  club: { type: 'UTF8', optional: true },
  location: { type: 'UTF8', optional: true },
  url: { type: 'UTF8', optional: true },
});

const iSailEventParticipant = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8', optional: true },
  class: { type: 'UTF8', optional: true },
  original_class_id: { type: 'UTF8', optional: true },
  class_name: { type: 'UTF8', optional: true },
  sail_no: { type: 'UTF8', optional: true },
  event: { type: 'UTF8', optional: true },
  original_event_id: { type: 'UTF8', optional: true },
  name: { type: 'UTF8', optional: true },
});

const iSailEventTracksData = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  event: { type: 'UTF8' },
  original_event_id: { type: 'UTF8' },
  min_lon: { type: 'UTF8', optional: true },
  max_lon: { type: 'UTF8', optional: true },
  min_lat: { type: 'UTF8', optional: true },
  max_lat: { type: 'UTF8', optional: true },
  start_time: { type: 'TIMESTAMP_MILLIS', optional: true },
  stop_time: { type: 'TIMESTAMP_MILLIS', optional: true },
});

const iSailTrack = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  event: { type: 'UTF8' },
  original_event_id: { type: 'UTF8' },
  track_data: { type: 'UTF8' },
  participant: { type: 'UTF8' },
  original_participant_id: { type: 'UTF8' },
  class: { type: 'UTF8', optional: true },
  original_class_id: { type: 'UTF8', optional: true },
  original_user_id: { type: 'UTF8', optional: true },
  user_name: { type: 'UTF8', optional: true },
  start_time: { type: 'TIMESTAMP_MILLIS', optional: true },
  stop_time: { type: 'TIMESTAMP_MILLIS', optional: true },
});

const iSailRace = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  event: { type: 'UTF8' },
  original_event_id: { type: 'UTF8' },
  name: { type: 'UTF8', optional: true },
  start: { type: 'TIMESTAMP_MILLIS', optional: true },
  stop: { type: 'TIMESTAMP_MILLIS', optional: true },
  wind_direction: { type: 'UTF8', optional: true },
  url: { type: 'UTF8', optional: true },
});

const iSailPosition = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  event: { type: 'UTF8' },
  original_event_id: { type: 'UTF8' },
  track_data: { type: 'UTF8' },
  track: { type: 'UTF8' },
  original_track_id: { type: 'UTF8' },
  participant: { type: 'UTF8' },
  original_participant_id: { type: 'UTF8' },
  class: { type: 'UTF8' },
  original_class_id: { type: 'UTF8' },
  time: { type: 'UTF8', optional: true },
  speed: { type: 'UTF8', optional: true },
  heading: { type: 'UTF8', optional: true },
  distance: { type: 'UTF8', optional: true },
  lon: { type: 'UTF8', optional: true },
  lat: { type: 'UTF8', optional: true },
});

const iSailMark = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  event: { type: 'UTF8' },
  original_event_id: { type: 'UTF8' },
  race: { type: 'UTF8' },
  original_race_id: { type: 'UTF8' },
  name: { type: 'UTF8', optional: true },
  lon: { type: 'UTF8', optional: true },
  lat: { type: 'UTF8', optional: true },
});

const iSailCourseMark = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  event: { type: 'UTF8' },
  original_event_id: { type: 'UTF8' },
  race: { type: 'UTF8' },
  original_race_id: { type: 'UTF8' },
  position: { type: 'UTF8', optional: true },
  mark: { type: 'UTF8', optional: true },
  original_mark_id: { type: 'UTF8', optional: true },
  startline: { type: 'UTF8', optional: true },
  original_startline_id: { type: 'UTF8', optional: true },
});

const iSailResult = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  event: { type: 'UTF8' },
  original_event_id: { type: 'UTF8' },
  race: { type: 'UTF8' },
  original_race_id: { type: 'UTF8' },
  name: { type: 'UTF8', optional: true },
  points: { type: 'UTF8', optional: true },
  time: { type: 'UTF8', optional: true },
  finaled: { type: 'UTF8', optional: true },
  participant: { type: 'UTF8', optional: true },
  original_participant_id: { type: 'UTF8', optional: true },
});

const iSailRounding = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  event: { type: 'UTF8' },
  original_event_id: { type: 'UTF8' },
  track: { type: 'UTF8' },
  original_track_id: { type: 'UTF8' },
  course_mark: { type: 'UTF8', optional: true },
  original_course_mark_id: { type: 'UTF8', optional: true },
  time: { type: 'UTF8', optional: true },
  time_since_last_mark: { type: 'UTF8', optional: true },
  distance_since_last_mark: { type: 'UTF8', optional: true },
  rst: { type: 'UTF8', optional: true },
  rsd: { type: 'UTF8', optional: true },
  max_speed: { type: 'UTF8', optional: true },
});

const iSailStartline = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  event: { type: 'UTF8' },
  original_event_id: { type: 'UTF8' },
  race: { type: 'UTF8' },
  original_race_id: { type: 'UTF8' },
  name: { type: 'UTF8', optional: true },
  lon_1: { type: 'UTF8', optional: true },
  lat_1: { type: 'UTF8', optional: true },
  lon_2: { type: 'UTF8', optional: true },
  lat_2: { type: 'UTF8', optional: true },
});

module.exports = {
  iSailClass,
  iSailEvent,
  iSailEventParticipant,
  iSailEventTracksData,
  iSailTrack,
  iSailRace,
  iSailPosition,
  iSailMark,
  iSailCourseMark,
  iSailResult,
  iSailRounding,
  iSailStartline,
};

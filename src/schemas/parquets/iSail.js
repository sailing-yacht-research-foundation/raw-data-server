var parquet = require('parquetjs-lite');

const iSailClass = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  name: { type: 'UTF8' },
});

const iSailEvent = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  name: { type: 'UTF8' },
  start_date: { type: 'TIMESTAMP_MILLIS' },
  start_timezone_type: { type: 'UTF8' },
  start_timezone: { type: 'UTF8' },
  stop_date: { type: 'TIMESTAMP_MILLIS' },
  stop_timezone_type: { type: 'UTF8' },
  stop_timezone: { type: 'UTF8' },
  club: { type: 'UTF8' },
  location: { type: 'UTF8' },
  url: { type: 'UTF8' },
});

const iSailEventParticipant = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  class: { type: 'UTF8' },
  original_class_id: { type: 'UTF8' },
  class_name: { type: 'UTF8' },
  sail_no: { type: 'UTF8', optional: true },
  event: { type: 'UTF8' },
  original_event_id: { type: 'UTF8' },
  name: { type: 'UTF8' },
});

const iSailEventTracksData = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  event: { type: 'UTF8' },
  original_event_id: { type: 'UTF8' },
  min_lon: { type: 'UTF8' },
  max_lon: { type: 'UTF8' },
  min_lat: { type: 'UTF8' },
  max_lat: { type: 'UTF8' },
  start_time: { type: 'TIMESTAMP_MILLIS' },
  stop_time: { type: 'TIMESTAMP_MILLIS' },
});

const iSailTrack = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  event: { type: 'UTF8' },
  original_event_id: { type: 'UTF8' },
  track_data: { type: 'UTF8' },
  participant: { type: 'UTF8' },
  original_participant_id: { type: 'UTF8' },
  class: { type: 'UTF8' },
  original_class_id: { type: 'UTF8' },
  original_user_id: { type: 'UTF8' },
  user_name: { type: 'UTF8' },
  start_time: { type: 'TIMESTAMP_MILLIS' },
  stop_time: { type: 'TIMESTAMP_MILLIS' },
});

const iSailRace = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  event: { type: 'UTF8' },
  original_event_id: { type: 'UTF8' },
  name: { type: 'UTF8' },
  start: { type: 'TIMESTAMP_MILLIS' },
  stop: { type: 'TIMESTAMP_MILLIS' },
  wind_direction: { type: 'UTF8' },
  url: { type: 'UTF8' },
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
  time: { type: 'UTF8' },
  speed: { type: 'UTF8' },
  heading: { type: 'UTF8' },
  distance: { type: 'UTF8' },
  lon: { type: 'UTF8' },
  lat: { type: 'UTF8' },
});

module.exports = {
  iSailClass,
  iSailEvent,
  iSailEventParticipant,
  iSailEventTracksData,
  iSailTrack,
  iSailRace,
  iSailPosition,
};

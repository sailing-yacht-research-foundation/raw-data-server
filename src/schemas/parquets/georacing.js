var parquet = require('parquetjs-lite');

const georacingLine = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  race: { type: 'UTF8' },
  race_original_id: { type: 'UTF8' },
  name: { type: 'UTF8', optional: true },
  type: { type: 'UTF8', optional: true },
  close: { type: 'UTF8', optional: true },
  percent_factor: { type: 'UTF8', optional: true },
  stroke_dasharray: { type: 'UTF8', optional: true },
  points: { type: 'UTF8', optional: true },
});

const georacingGroundPlace = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  race: { type: 'UTF8' },
  race_original_id: { type: 'UTF8' },
  place_or_ground: { type: 'UTF8', optional: true },
  name: { type: 'UTF8', optional: true },
  lon: { type: 'UTF8', optional: true },
  lat: { type: 'UTF8', optional: true },
  size: { type: 'UTF8', optional: true },
  undefined: { type: 'UTF8', optional: true },
  zoom_min: { type: 'UTF8', optional: true },
  zoom_max: { type: 'UTF8', optional: true },
});

const georacingCourseElement = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  race: { type: 'UTF8' },
  race_original_id: { type: 'UTF8' },
  course: { type: 'UTF8' },
  course_original_id: { type: 'UTF8' },
  course_object: { type: 'UTF8' },
  course_object_original_id: { type: 'UTF8' },
  name: { type: 'UTF8', optional: true },
  visible: { type: 'UTF8', optional: true },
  distance: { type: 'UTF8', optional: true },
  orientation_angle: { type: 'UTF8', optional: true },
  type: { type: 'UTF8', optional: true },
  course_element_type: { type: 'UTF8', optional: true },
  model: { type: 'UTF8', optional: true },
  size: { type: 'UTF8', optional: true },
  orientation_mode: { type: 'UTF8', optional: true },
  longitude: { type: 'UTF8', optional: true },
  latitude: { type: 'UTF8', optional: true },
  altitude: { type: 'UTF8', optional: true },
});

const georacingCourseObject = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  race: { type: 'UTF8' },
  race_original_id: { type: 'UTF8' },
  course: { type: 'UTF8' },
  course_original_id: { type: 'UTF8' },
  name: { type: 'UTF8', optional: true },
  short_name: { type: 'UTF8', optional: true },
  order: { type: 'UTF8', optional: true },
  raise_event: { type: 'UTF8', optional: true },
  show_layline: { type: 'UTF8', optional: true },
  is_image_reverse: { type: 'UTF8', optional: true },
  altitude_max: { type: 'UTF8', optional: true },
  altitude_min: { type: 'UTF8', optional: true },
  circle_size: { type: 'UTF8', optional: true },
  splittimes_visible: { type: 'UTF8', optional: true },
  hide_on_timeline: { type: 'UTF8', optional: true },
  lap_number: { type: 'UTF8', optional: true },
  distance: { type: 'UTF8', optional: true },
  type: { type: 'UTF8', optional: true },
  role: { type: 'UTF8', optional: true },
  rounding: { type: 'UTF8', optional: true },
  headline_orientation: { type: 'UTF8', optional: true },
});

const georacingCourse = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  race: { type: 'UTF8' },
  race_original_id: { type: 'UTF8' },
  name: { type: 'UTF8', optional: true },
  active: { type: 'UTF8', optional: true },
  has_track: { type: 'UTF8', optional: true },
  url: { type: 'UTF8', optional: true },
  course_type: { type: 'UTF8', optional: true },
});

const georacingSplittime = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  race: { type: 'UTF8' },
  race_original_id: { type: 'UTF8' },
  event: { type: 'UTF8' },
  event_original_id: { type: 'UTF8' },
  name: { type: 'UTF8', optional: true },
  short_name: { type: 'UTF8', optional: true },
  splittimes_visible: { type: 'UTF8', optional: true },
  hide_on_timeline: { type: 'UTF8', optional: true },
  lap_number: { type: 'UTF8', optional: true },
  role: { type: 'UTF8', optional: true },
});

const georacingSplittimeObject = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  actor: { type: 'UTF8' },
  actor_original_id: { type: 'UTF8' },
  splittime: { type: 'UTF8' },
  splittime_original_id: { type: 'UTF8' },
  capital: { type: 'UTF8', optional: true },
  max_speed: { type: 'UTF8', optional: true },
  duration: { type: 'UTF8', optional: true },
  detection_method_id: { type: 'UTF8', optional: true },
  is_pit_lap: { type: 'UTF8', optional: true },
  run: { type: 'UTF8', optional: true },
  value_in: { type: 'UTF8', optional: true },
  value_out: { type: 'UTF8', optional: true },
  official: { type: 'UTF8', optional: true },
  hours_mandatory_rest: { type: 'UTF8', optional: true },
  rest_not_in_cp: { type: 'UTF8', optional: true },
  rank: { type: 'UTF8', optional: true },
  rr: { type: 'UTF8', optional: true },
  gap: { type: 'UTF8', optional: true },
  time: { type: 'UTF8', optional: true },
  time_out: { type: 'UTF8', optional: true },
});

const georacingPosition = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  trackable_type: { type: 'UTF8', optional: true },
  trackable_id: { type: 'UTF8' },
  trackable_original_id: { type: 'UTF8' },
  race: { type: 'UTF8' },
  race_original_id: { type: 'UTF8' },
  event: { type: 'UTF8' },
  event_original_id: { type: 'UTF8' },
  timestamp: { type: 'UTF8', optional: true },
  lon: { type: 'UTF8', optional: true },
  lat: { type: 'UTF8', optional: true },
  offset: { type: 'UTF8', optional: true },
  r: { type: 'UTF8', optional: true },
  cl: { type: 'UTF8', optional: true },
  d: { type: 'UTF8', optional: true },
  lg: { type: 'UTF8', optional: true },
  lt: { type: 'UTF8', optional: true },
  al: { type: 'UTF8', optional: true },
  s: { type: 'UTF8', optional: true },
  h: { type: 'UTF8', optional: true },
  dtnm: { type: 'UTF8', optional: true },
});

const georacingActor = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8', optional: true },
  race: { type: 'UTF8' },
  race_original_id: { type: 'UTF8' },
  event: { type: 'UTF8' },
  event_original_id: { type: 'UTF8' },
  tracker_id: { type: 'UTF8', optional: true },
  tracker2_id: { type: 'UTF8', optional: true },
  id_provider_actor: { type: 'UTF8', optional: true },
  team_id: { type: 'UTF8', optional: true },
  profile_id: { type: 'UTF8', optional: true },
  start_number: { type: 'UTF8', optional: true },
  first_name: { type: 'UTF8', optional: true },
  middle_name: { type: 'UTF8', optional: true },
  last_name: { type: 'UTF8', optional: true },
  name: { type: 'UTF8', optional: true },
  big_name: { type: 'UTF8', optional: true },
  short_name: { type: 'UTF8', optional: true },
  members: { type: 'UTF8', optional: true },
  active: { type: 'UTF8', optional: true },
  visible: { type: 'UTF8', optional: true },
  orientation_angle: { type: 'UTF8', optional: true },
  start_time: { type: 'UTF8', optional: true },
  has_penality: { type: 'UTF8', optional: true },
  sponsor_url: { type: 'UTF8', optional: true },
  start_order: { type: 'UTF8', optional: true },
  rating: { type: 'UTF8', optional: true },
  penality: { type: 'UTF8', optional: true },
  penality_time: { type: 'UTF8', optional: true },
  capital1: { type: 'UTF8', optional: true },
  capital2: { type: 'UTF8', optional: true },
  is_security: { type: 'UTF8', optional: true },
  full_name: { type: 'UTF8', optional: true },
  categories: { type: 'UTF8', optional: true },
  categories_name: { type: 'UTF8', optional: true },
  all_info: { type: 'UTF8', optional: true },
  nationality: { type: 'UTF8', optional: true },
  model: { type: 'UTF8', optional: true },
  size: { type: 'UTF8', optional: true },
  team: { type: 'UTF8', optional: true },
  type: { type: 'UTF8', optional: true },
  orientation_mode: { type: 'UTF8', optional: true },
  id_provider_tracker: { type: 'UTF8', optional: true },
  id_provider_tracker2: { type: 'UTF8', optional: true },
  states: { type: 'UTF8', optional: true },
  person: { type: 'UTF8', optional: true },
});

const georacingWeather = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  race: { type: 'UTF8' },
  race_original_id: { type: 'UTF8' },
  wind_direction: { type: 'UTF8', optional: true },
  wind_strength: { type: 'UTF8', optional: true },
  wind_strength_unit: { type: 'UTF8', optional: true },
  temperature: { type: 'UTF8', optional: true },
  temperature_unit: { type: 'UTF8', optional: true },
  type: { type: 'UTF8', optional: true },
  time: { type: 'UTF8', optional: true },
});

const georacingRace = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  event: { type: 'UTF8' },
  event_original_id: { type: 'UTF8' },
  name: { type: 'UTF8', optional: true },
  short_name: { type: 'UTF8', optional: true },
  short_description: { type: 'UTF8', optional: true },
  time_zone: { type: 'UTF8', optional: true },
  available_time: { type: 'UTF8', optional: true },
  start_time: { type: 'UTF8', optional: true },
  end_time: { type: 'UTF8', optional: true },
  url: { type: 'UTF8', optional: true },
  player_version: { type: 'UTF8', optional: true },
});

const georacingEvent = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  name: { type: 'UTF8', optional: true },
  short_name: { type: 'UTF8', optional: true },
  time_zone: { type: 'UTF8', optional: true },
  description_en: { type: 'UTF8', optional: true },
  description_fr: { type: 'UTF8', optional: true },
  short_description: { type: 'UTF8', optional: true },
  start_time: { type: 'UTF8', optional: true },
  end_time: { type: 'UTF8', optional: true },
});

module.exports = {
  georacingLine,
  georacingGroundPlace,
  georacingCourseElement,
  georacingCourseObject,
  georacingCourse,
  georacingSplittime,
  georacingSplittimeObject,
  georacingPosition,
  georacingActor,
  georacingWeather,
  georacingRace,
  georacingEvent,
};
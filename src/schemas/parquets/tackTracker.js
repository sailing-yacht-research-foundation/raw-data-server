var parquet = require('parquetjs-lite');

const tackTrackerCombined = new parquet.ParquetSchema({
  race_id: { type: 'UTF8' },
  race_original_id: { type: 'UTF8' },
  url: { type: 'UTF8', optional: true },
  regatta: { type: 'UTF8', optional: true },
  regatta_original_id: { type: 'UTF8', optional: true },
  regatta_url: { type: 'UTF8', optional: true },
  user: { type: 'UTF8', optional: true },
  user_original_id: { type: 'UTF8', optional: true },
  start: { type: 'UTF8', optional: true },
  state: { type: 'UTF8', optional: true },
  name: { type: 'UTF8', optional: true },
  type: { type: 'UTF8', optional: true },
  finish_at_start: { type: 'UTF8', optional: true },
  span: { type: 'UTF8', optional: true },
  course: { type: 'UTF8', optional: true },
  event_notes: { type: 'UTF8', optional: true },
  course_notes: { type: 'UTF8', optional: true },
  upload_params: { type: 'UTF8', optional: true },
  boats: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      details: { type: 'UTF8', optional: true },
      color: { type: 'UTF8', optional: true },
      unknown_1: { type: 'UTF8', optional: true },
      unknown_2: { type: 'UTF8', optional: true },
      unknown_3: { type: 'UTF8', optional: true },
      unknown_4: { type: 'UTF8', optional: true },
      unknown_5: { type: 'UTF8', optional: true },
      unknown_6: { type: 'UTF8', optional: true },
      name: { type: 'UTF8', optional: true },
    },
  },
  defaults: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      lon: { type: 'DOUBLE', optional: true },
      lat: { type: 'DOUBLE', optional: true },
      color: { type: 'UTF8', optional: true },
      trim: { type: 'UTF8', optional: true },
    },
  },
  finishes: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      finish_mark_name: { type: 'UTF8', optional: true },
      finish_mark_lat: { type: 'UTF8', optional: true },
      finish_mark_lon: { type: 'UTF8', optional: true },
      finish_mark_type: { type: 'UTF8', optional: true },
      finish_pin_name: { type: 'UTF8', optional: true },
      finish_pin_lat: { type: 'UTF8', optional: true },
      finish_pin_lon: { type: 'UTF8', optional: true },
      finish_pin_type: { type: 'UTF8', optional: true },
    },
  },
  marks: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      name: { type: 'UTF8', optional: true },
      lon: { type: 'UTF8', optional: true },
      lat: { type: 'UTF8', optional: true },
      type: { type: 'UTF8', optional: true },
    },
  },
  positions: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      boat: { type: 'UTF8', optional: true },
      time: { type: 'UTF8', optional: true },
      lon: { type: 'UTF8', optional: true },
      lat: { type: 'UTF8', optional: true },
    },
  },
  starts: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      start_mark_name: { type: 'UTF8', optional: true },
      start_mark_lat: { type: 'UTF8', optional: true },
      start_mark_lon: { type: 'UTF8', optional: true },
      start_mark_type: { type: 'UTF8', optional: true },
      start_pin_name: { type: 'UTF8', optional: true },
      start_pin_lat: { type: 'UTF8', optional: true },
      start_pin_lon: { type: 'UTF8', optional: true },
      start_pin_type: { type: 'UTF8', optional: true },
    },
  },
});

module.exports = {
  tackTrackerCombined,
};

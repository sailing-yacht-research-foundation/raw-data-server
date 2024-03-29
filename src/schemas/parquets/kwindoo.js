var parquet = require('parquetjs-lite');

const kwindooCombined = new parquet.ParquetSchema({
  regatta_id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  owner: { type: 'UTF8' },
  owner_original_id: { type: 'UTF8' },
  owner_data: {
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'UTF8' },
      regatta: { type: 'UTF8' },
      regatta_original_id: { type: 'UTF8' },
      first_name: { type: 'UTF8' },
      last_name: { type: 'UTF8' },
      email: { type: 'UTF8' },
      facebook_user_id: { type: 'UTF8' },
    },
  },
  name: { type: 'UTF8' },
  timezone: { type: 'UTF8' },
  public: { type: 'UTF8' },
  private: { type: 'UTF8' },
  sponsor: { type: 'UTF8', optional: true },
  display_waypoint_pass_radius: { type: 'UTF8', optional: true },
  name_slug: { type: 'UTF8' },
  first_start_time: { type: 'UTF8' },
  last_end_time: { type: 'UTF8' },
  updated_at_timestamp: { type: 'UTF8' },
  regatta_logo_path: { type: 'UTF8' },
  featured_background_path: { type: 'UTF8' },
  sponsor_logo_path: { type: 'UTF8' },

  races: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'UTF8' },
      name: { type: 'UTF8', optional: true },
      start_time: { type: 'UTF8', optional: true },
      end_time: { type: 'UTF8', optional: true },
      start_timestamp: { type: 'UTF8', optional: true },
      end_timestamp: { type: 'UTF8', optional: true },
      running_group_ids: { type: 'UTF8', optional: true },
      url: { type: 'UTF8' },
    },
  },
  boats: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'UTF8' },
      race: { type: 'UTF8' },
      race_original_id: { type: 'UTF8' },
      first_name: { type: 'UTF8', optional: true },
      last_name: { type: 'UTF8', optional: true },
      email: { type: 'UTF8', optional: true },
      boat_name: { type: 'UTF8', optional: true },
      sail_number: { type: 'UTF8', optional: true },
      race_number: { type: 'UTF8', optional: true },
      handycap: { type: 'UTF8', optional: true },
      helmsman: { type: 'UTF8', optional: true },
      owner_name: { type: 'UTF8', optional: true },
      homeport: { type: 'UTF8', optional: true },
      registry_number: { type: 'UTF8', optional: true },
      not_racer: { type: 'UTF8', optional: true },
      boat_type_name: { type: 'UTF8', optional: true },
      boat_type_alias: { type: 'UTF8', optional: true },
      class: { type: 'UTF8', optional: true },
    },
  },
  comments: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'UTF8' },
      race: { type: 'UTF8' },
      race_original_id: { type: 'UTF8' },
      text: { type: 'UTF8', optional: true },
      event_type: { type: 'UTF8', optional: true },
      lat: { type: 'UTF8', optional: true },
      lon: { type: 'UTF8', optional: true },
      created_at: { type: 'UTF8', optional: true },
      created_at_timestamp: { type: 'UTF8', optional: true },
      boat_name: { type: 'UTF8', optional: true },
    },
  },
  homeportLocations: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'UTF8' },
      country: { type: 'UTF8', optional: true },
      state: { type: 'UTF8', optional: true },
      city: { type: 'UTF8', optional: true },
      address: { type: 'UTF8', optional: true },
      zip: { type: 'UTF8', optional: true },
      notice: { type: 'UTF8', optional: true },
      lat: { type: 'UTF8', optional: true },
      lon: { type: 'UTF8', optional: true },
    },
  },
  markers: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'UTF8' },
      race: { type: 'UTF8' },
      race_original_id: { type: 'UTF8' },
      name: { type: 'UTF8', optional: true },
      lon: { type: 'UTF8', optional: true },
      lat: { type: 'UTF8', optional: true },
      approach_radius: { type: 'UTF8', optional: true },
    },
  },
  MIAs: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'UTF8' },
      race: { type: 'UTF8' },
      race_original_id: { type: 'UTF8' },
      name: { type: 'UTF8', optional: true },
      northeast_lat: { type: 'UTF8', optional: true },
      northeast_lon: { type: 'UTF8', optional: true },
      southwest_lat: { type: 'UTF8', optional: true },
      southwest_lon: { type: 'UTF8', optional: true },
      rotation: { type: 'UTF8', optional: true },
    },
  },
  POIs: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'UTF8' },
      name: { type: 'UTF8', optional: true },
      lat: { type: 'UTF8', optional: true },
      lon: { type: 'UTF8', optional: true },
      link: { type: 'UTF8', optional: true },
      description: { type: 'UTF8', optional: true },
    },
  },
  runningGroups: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'UTF8' },
      name: { type: 'UTF8', optional: true },
      description: { type: 'UTF8', optional: true },
    },
  },
  videoStreams: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'UTF8' },
      source: { type: 'UTF8', optional: true },
      video_id: { type: 'UTF8', optional: true },
      start_time: { type: 'UTF8', optional: true },
      end_time: { type: 'UTF8', optional: true },
      start_timestamp: { type: 'UTF8', optional: true },
      end_timestamp: { type: 'UTF8', optional: true },
    },
  },
  waypoints: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'UTF8' },
      race: { type: 'UTF8' },
      race_original_id: { type: 'UTF8' },
      primary_marker_id: { type: 'UTF8', optional: true },
      secondary_marker_id: { type: 'UTF8', optional: true },
      type: { type: 'UTF8', optional: true },
      role: { type: 'UTF8', optional: true },
      order_number: { type: 'UTF8', optional: true },
      diameter: { type: 'UTF8', optional: true },
      pass_direction: { type: 'UTF8', optional: true },
      primary_marker_name: { type: 'UTF8', optional: true },
      primary_marker_approach_radius: { type: 'UTF8', optional: true },
      primary_marker_lat: { type: 'UTF8', optional: true },
      primary_marker_lon: { type: 'UTF8', optional: true },
      secondary_marker_name: { type: 'UTF8', optional: true },
      secondary_marker_approach_radius: { type: 'UTF8', optional: true },
      secondary_marker_lat: { type: 'UTF8', optional: true },
      secondary_marker_lon: { type: 'UTF8', optional: true },
    },
  },
});

const kwindooPosition = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  regatta: { type: 'UTF8' },
  regatta_original_id: { type: 'UTF8' },
  race: { type: 'UTF8' },
  race_original_id: { type: 'UTF8' },
  boat: { type: 'UTF8' },
  boat_original_id: { type: 'UTF8' },
  i: { type: 'UTF8', optional: true },
  u: { type: 'UTF8', optional: true },
  t: { type: 'UTF8', optional: true },
  lat: { type: 'UTF8', optional: true },
  lon: { type: 'UTF8', optional: true },
  b: { type: 'UTF8', optional: true },
  a: { type: 'UTF8', optional: true },
  d: { type: 'UTF8', optional: true },
  s: { type: 'UTF8', optional: true },
  y: { type: 'UTF8', optional: true },
});

module.exports = {
  kwindooCombined,
  kwindooPosition,
};

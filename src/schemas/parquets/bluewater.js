var parquet = require('parquetjs-lite');

const bluewaterPosition = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  race: { type: 'UTF8' },
  race_original_id: { type: 'UTF8', optional: true },
  boat_original_id: { type: 'UTF8', optional: true },
  boat_name: { type: 'UTF8', optional: true },
  geometry_type: { type: 'UTF8', optional: true },
  coordinate_0: { type: 'UTF8', optional: true },
  coordinate_1: { type: 'UTF8', optional: true },
  coordinate_2: { type: 'UTF8', optional: true },
  cog: { type: 'UTF8', optional: true },
  date: { type: 'UTF8', optional: true },
  device_id: { type: 'UTF8', optional: true },
  sog: { type: 'UTF8', optional: true },
  source: { type: 'UTF8', optional: true },
});

const bluewaterCombined = new parquet.ParquetSchema({
  race_id: { type: 'UTF8' },
  race_original_id: { type: 'UTF8', optional: true },
  name: { type: 'UTF8', optional: true },
  referral_url: { type: 'UTF8', optional: true },
  start_time: { type: 'UTF8', optional: true },
  timezone_location: { type: 'UTF8', optional: true },
  timezone_offset: { type: 'INT64', optional: true },
  finish_timezone_location: { type: 'UTF8', optional: true },
  finish_timezone_offset: { type: 'INT64', optional: true },
  track_time_start: { type: 'UTF8', optional: true },
  track_time_finish: { type: 'UTF8', optional: true },
  account_name: { type: 'UTF8', optional: true },
  account_website: { type: 'UTF8', optional: true },
  calculation: { type: 'UTF8', optional: true },
  slug: { type: 'UTF8', optional: true },
  boats: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'UTF8', optional: true },
      name: { type: 'UTF8', optional: true },
      mmsi: { type: 'UTF8', optional: true },
      skipper: { type: 'UTF8', optional: true },
      sail_no: { type: 'UTF8', optional: true },
      design: { type: 'UTF8', optional: true },
      length: { type: 'UTF8', optional: true },
      width: { type: 'UTF8', optional: true },
      units: { type: 'UTF8', optional: true },
      draft: { type: 'UTF8', optional: true },
      type: { type: 'UTF8', optional: true },
      bio: { type: 'UTF8', optional: true },
      country_code: { type: 'UTF8', optional: true },
      country_name: { type: 'UTF8', optional: true },
      finish_time: { type: 'UTF8', optional: true },
      status: { type: 'UTF8', optional: true },
      message: { type: 'UTF8', optional: true },
    },
  },
  boatHandicaps: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'UTF8', optional: true },
      boat: { type: 'UTF8', optional: true },
      boat_original_id: { type: 'UTF8', optional: true },
      name: { type: 'UTF8', optional: true },
      rating: { type: 'UTF8', optional: true },
      division: { type: 'UTF8', optional: true },
    },
  },
  boatSocialMedias: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      boat: { type: 'UTF8', optional: true },
      boat_original_id: { type: 'UTF8', optional: true },
      icon: { type: 'UTF8', optional: true },
      url: { type: 'UTF8', optional: true },
    },
  },
  crews: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      boat: { type: 'UTF8' },
      boat_original_id: { type: 'UTF8', optional: true },
      role: { type: 'UTF8', optional: true },
      first_name: { type: 'UTF8', optional: true },
      last_name: { type: 'UTF8', optional: true },
      image_url: { type: 'UTF8', optional: true },
      bio: { type: 'UTF8', optional: true },
      country_code: { type: 'UTF8', optional: true },
      country_name: { type: 'UTF8', optional: true },
    },
  },
  crewSocialMedias: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      crew: { type: 'UTF8' },
      url: { type: 'UTF8', optional: true },
    },
  },
  maps: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      center_lon: { type: 'DOUBLE' },
      center_lat: { type: 'DOUBLE' },
      start_line: { type: 'UTF8', optional: true },
      finish_line: { type: 'UTF8', optional: true },
      course: { type: 'UTF8', optional: true },
      regions: { type: 'UTF8', optional: true },
    },
  },
  announcements: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      html: { type: 'UTF8', optional: true },
      time: { type: 'UTF8', optional: true },
    },
  },
});

module.exports = {
  bluewaterPosition,
  bluewaterCombined,
};

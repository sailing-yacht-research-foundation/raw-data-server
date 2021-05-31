var parquet = require('parquetjs-lite');

const yellowbrickCombined = new parquet.ParquetSchema({
  race_id: { type: 'UTF8' },
  tz: { type: 'UTF8', optional: true },
  tz_offset: { type: 'UTF8', optional: true },
  lapz: { type: 'UTF8', optional: true },
  laps: { type: 'UTF8', optional: true },
  track_width: { type: 'UTF8', optional: true },
  motd: { type: 'UTF8', optional: true },
  associated2: { type: 'UTF8', optional: true },
  associated: { type: 'UTF8', optional: true },
  hashtag: { type: 'UTF8', optional: true },
  start: { type: 'UTF8', optional: true },
  stop: { type: 'UTF8', optional: true },
  race_code: { type: 'UTF8', optional: true },
  title: { type: 'UTF8', optional: true },
  flag_stopped: { type: 'UTF8', optional: true },
  super_lines: { type: 'UTF8', optional: true },
  kml_s3_id: { type: 'UTF8', optional: true },
  text_leaderboard: { type: 'UTF8', optional: true },
  distance: { type: 'UTF8', optional: true },
  url: { type: 'UTF8', optional: true },
  courseNodes: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      order: { type: 'INT64', optional: true },
      lat: { type: 'UTF8', optional: true },
      lon: { type: 'UTF8', optional: true },
      name: { type: 'UTF8', optional: true },
    },
  },
  leaderboardTeams: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      tag: { type: 'UTF8' },
      tag_original_id: { type: 'UTF8' },
      type: { type: 'UTF8' },
      c_elapsed: { type: 'UTF8' },
      old: { type: 'UTF8', optional: true },
      d24: { type: 'UTF8', optional: true },
      started: { type: 'UTF8', optional: true },
      finished: { type: 'UTF8', optional: true },
      elapsed: { type: 'UTF8', optional: true },
      c_elapsed_formatted: { type: 'UTF8', optional: true },
      rank_r: { type: 'UTF8', optional: true },
      rank_s: { type: 'UTF8', optional: true },
      tcf: { type: 'UTF8', optional: true },
      dff: { type: 'UTF8', optional: true },
      team_original_id: { type: 'UTF8', optional: true },
      team: { type: 'UTF8', optional: true },
      finished_at: { type: 'UTF8', optional: true },
      elapsed_formatted: { type: 'UTF8', optional: true },
      dmg: { type: 'UTF8', optional: true },
      status: { type: 'UTF8', optional: true },
    },
  },
  positions: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'UTF8', optional: true },
      team_original_id: { type: 'UTF8' },
      team: { type: 'UTF8' },
      pc: { type: 'UTF8', optional: true },
      dtf_km: { type: 'UTF8', optional: true },
      dtf_nm: { type: 'UTF8', optional: true },
      lon: { type: 'UTF8', optional: true },
      lat: { type: 'UTF8', optional: true },
      timestamp: { type: 'UTF8', optional: true },
      sog_kmph: { type: 'UTF8', optional: true },
      tx_at: { type: 'UTF8', optional: true },
      altitude: { type: 'UTF8', optional: true },
      type: { type: 'UTF8', optional: true },
      battery: { type: 'UTF8', optional: true },
      sog_knots: { type: 'UTF8', optional: true },
      alert: { type: 'BOOLEAN', optional: true },
      cog: { type: 'UTF8', optional: true },
      gps_at: { type: 'UTF8', optional: true },
    },
  },
  pois: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'UTF8' },
      nodes: { type: 'UTF8', optional: true },
      polygon: { type: 'BOOLEAN', optional: true },
      name: { type: 'UTF8', optional: true },
    },
  },
  tags: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'UTF8' },
      lb: { type: 'UTF8', optional: true },
      handicap: { type: 'UTF8', optional: true },
      name: { type: 'UTF8', optional: true },
      start: { type: 'UTF8', optional: true },
      laps: { type: 'UTF8', optional: true },
      sort: { type: 'UTF8', optional: true },
    },
  },
  teams: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'UTF8' },
      owner: { type: 'UTF8', optional: true },
      country: { type: 'UTF8', optional: true },
      flag: { type: 'UTF8', optional: true },
      sail: { type: 'UTF8', optional: true },
      start: { type: 'UTF8', optional: true },
      tcf1: { type: 'UTF8', optional: true },
      tcf2: { type: 'UTF8', optional: true },
      tcf3: { type: 'UTF8', optional: true },
      started: { type: 'UTF8', optional: true },
      finished_at: { type: 'UTF8', optional: true },
      captain: { type: 'UTF8', optional: true },
      url: { type: 'UTF8', optional: true },
      type: { type: 'UTF8', optional: true },
      tags: { type: 'UTF8', optional: true },
      max_laps: { type: 'UTF8', optional: true },
      name: { type: 'UTF8', optional: true },
      model: { type: 'UTF8', optional: true },
      marker_text: { type: 'UTF8', optional: true },
      status: { type: 'UTF8', optional: true },
      explain: { type: 'UTF8', optional: true },
    },
  },
});

module.exports = {
  yellowbrickCombined,
};

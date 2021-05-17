module.exports = (sequelize, Sequelize) => {
  const kattackRace = sequelize.define(
    'kattackRace',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      original_paradigm: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      yacht_club: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      original_yacht_club_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      original_fleet_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      original_series_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      original_course_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      stop: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      days: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      sleep_hour: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      wake_hour: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      heartbeat_int_sec: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      wait_samp_int_sec: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      active_samp_int_sec: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      active_pts: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      still_pts: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      still_radius_met: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      upload_int_sec: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      modified_time: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      password: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      race_start_time_utc: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      feed_start_time_epoch_offset_sec: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      prestart_length_sec: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      race_start_time_epoch_offset_sec: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      race_finish_time_epoch_offset_sec: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      feed_length_sec: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      race_length_sec: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      is_distance_race: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      is_open_feed: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      speed_filter_kts: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_live: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      has_started: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      lon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      course_heading_deg: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      js_race_feed_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      js_race_course_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      url: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      leaderboard_data: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'kattackRaces',
      timestamps: false,
    },
  );

  return kattackRace;
};

module.exports = (sequelize, Sequelize) => {
  const americasCup2021Race = sequelize.define(
    'AmericasCup2021Race',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      event_name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      race_name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      file_name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      terrain_config_location_lon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      terrain_config_location_lat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      boundary_center_set: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      current_leg: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      min_race_time: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      max_race_time: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      last_packet_time: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      packet_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      start_time: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      num_legs: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      course_angle: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      race_status: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      boat_type: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      live_delay_secs: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      scene_center_utm_lon: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      scene_center_utm_lat: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      sim_time: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
    },
    {
      tableName: 'AmericasCup2021Races',
      timestamps: false,
    },
  );
  return americasCup2021Race;
};

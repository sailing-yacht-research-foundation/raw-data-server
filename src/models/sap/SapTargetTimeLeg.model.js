module.exports = (sequelize, Sequelize) => {
  const sapTargetTimeLeg = sequelize.define(
    'SapTargetTimeLeg',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      race_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      duration_millis: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      leg_start_millis: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      leg_duration_millis: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      leg_distance_meters: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      leg_bearing_degrees: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      leg_true_wind_angle_to_leg_degrees: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      leg_type: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      timepoint: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      speed_in_knots: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      direction: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      leg_wind_position_latitude_deg: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      leg_wind_position_longitude_deg: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
    },
    {
      tableName: 'SapTargetTimeLegs',
      timestamps: false,
    },
  );
  return sapTargetTimeLeg;
};

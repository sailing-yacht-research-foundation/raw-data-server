module.exports = (sequelize, Sequelize) => {
  const sapCompetitorManeuver = sequelize.define(
    'SapCompetitorManeuver',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      race_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      competitor_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      competitor_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      maneuver_type: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      new_tack: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      speed_before_in_knots: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      cog_before_in_true_degrees: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      speed_after_in_knots: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      cog_after_in_true_degrees: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      direction_change_in_degrees: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      max_turning_rate_in_degrees_per_second: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      avg_turning_rate_in_degrees_per_second: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      lowest_speed_in_knots: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      mark_passing: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      maneuver_loss_geographical_miles: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      maneuver_loss_sea_miles: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      maneuver_loss_nautical_miles: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      maneuver_loss_meters: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      maneuver_loss_kilometers: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      maneuver_loss_central_angle_deg: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      maneuver_loss_central_angle_rad: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      position_time_type: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      position_time_lat_deg: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      position_time_lon_deg: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      position_time_unixtime: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
    },
    {
      tableName: 'SapCompetitorManeuvers',
      timestamps: false,
    },
  );
  return sapCompetitorManeuver;
};

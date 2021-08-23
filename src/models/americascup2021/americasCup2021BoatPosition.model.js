module.exports = (sequelize, Sequelize) => {
  const americasCup2021BoatPosition = sequelize.define(
    'AmericasCup2021BoatPosition',
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
      boat_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      boat_original_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      coordinate_interpolator_lon: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      coordinate_interpolator_lon_time: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      coordinate_interpolator_lat: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      coordinate_interpolator_lat_time: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      heading_interpolator_value: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      heading_interpolator_time: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      heel_interpolator_value: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      heel_interpolator_time: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      pitch_interpolator_value: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      pitch_interpolator_time: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      dtl_interpolator_value: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      dtl_interpolator_time: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      speed_interpolator_value: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      speed_interpolator_time: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      elev_interpolator_value: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      elev_interpolator_time: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      leg_progress_interpolator_value: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      leg_progress_interpolator_time: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
    },
    {
      tableName: 'AmericasCup2021BoatPositions',
      timestamps: false,
    },
  );
  return americasCup2021BoatPosition;
};

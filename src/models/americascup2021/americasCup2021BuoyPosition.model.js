module.exports = (sequelize, Sequelize) => {
  const americasCup2021BuoyPosition = sequelize.define(
    'AmericasCup2021BuoyPosition',
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
      mark_id: {
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
      heading_interpolator_lat_time: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
    },
    {
      tableName: 'AmericasCup2021BuoyPositions',
      timestamps: false,
    },
  );
  return americasCup2021BuoyPosition;
};

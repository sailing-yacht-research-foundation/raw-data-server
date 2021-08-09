module.exports = (sequelize, Sequelize) => {
  const americasCup2021BoatRightFoilPosition = sequelize.define(
    'AmericasCup2021BoatRightFoilPosition',
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
      boat_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      left_foil_position_interpolator_value: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      left_foil_position_interpolator_time: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
    },
    {
      tableName: 'AmericasCup2021BoatRightFoilPositions',
      timestamps: false,
    },
  );
  return americasCup2021BoatRightFoilPosition;
};

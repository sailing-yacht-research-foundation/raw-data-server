module.exports = (sequelize, Sequelize) => {
  const americasCup2021BoatLeftFoilState = sequelize.define(
    'AmericasCup2021BoatLeftFoilState',
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
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      left_foil_state_interpolator_value: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      left_foil_state_interpolator_time: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
    },
    {
      tableName: 'AmericasCup2021BoatLeftFoilStates',
      timestamps: false,
    },
  );
  return americasCup2021BoatLeftFoilState;
};

module.exports = (sequelize, Sequelize) => {
  const americasCup2021BuoyPositionState = sequelize.define(
    'AmericasCup2021BuoyPositionState',
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
      state_interpolator_value: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      state_interpolator_time: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
    },
    {
      tableName: 'AmericasCup2021BuoyPositionStates',
      timestamps: false,
    },
  );
  return americasCup2021BuoyPositionState;
};

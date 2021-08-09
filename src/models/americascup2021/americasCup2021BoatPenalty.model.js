module.exports = (sequelize, Sequelize) => {
  const americasCup2021BoatPenalty = sequelize.define(
    'AmericasCup2021BoatPenalty',
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
      penalty_count_interpolator_value: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      penalty_count_interpolator_time: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
    },
    {
      tableName: 'AmericasCup2021BoatPenalties',
      timestamps: false,
    },
  );
  return americasCup2021BoatPenalty;
};

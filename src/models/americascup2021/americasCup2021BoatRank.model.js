module.exports = (sequelize, Sequelize) => {
  const americasCup2021BoatRank = sequelize.define(
    'AmericasCup2021BoatRank',
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
      rank_interpolator_value: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      rank_interpolator_time: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
    },
    {
      tableName: 'AmericasCup2021BoatRanks',
      timestamps: false,
    },
  );
  return americasCup2021BoatRank;
};

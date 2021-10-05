module.exports = (sequelize, Sequelize) => {
  const americasCup2021BoatTwd = sequelize.define(
    'AmericasCup2021BoatTwd',
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
      twd_interpolator_value: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      twd_interpolator_time: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
    },
    {
      tableName: 'AmericasCup2021BoatTwds',
      timestamps: false,
    },
  );
  return americasCup2021BoatTwd;
};

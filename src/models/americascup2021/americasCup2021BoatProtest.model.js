module.exports = (sequelize, Sequelize) => {
  const americasCup2021BoatProtest = sequelize.define(
    'AmericasCup2021BoatProtest',
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
      protest_interpolator_value: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      protest_interpolator_time: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
    },
    {
      tableName: 'AmericasCup2021BoatProtests',
      timestamps: false,
    },
  );
  return americasCup2021BoatProtest;
};

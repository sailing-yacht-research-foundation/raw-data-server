module.exports = (sequelize, Sequelize) => {
  const americasCup2021BoatSow = sequelize.define(
    'AmericasCup2021BoatSow',
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
      sow_interpolator_value: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      sow_interpolator_time: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
    },
    {
      tableName: 'AmericasCup2021BoatSows',
      timestamps: false,
    },
  );
  return americasCup2021BoatSow;
};

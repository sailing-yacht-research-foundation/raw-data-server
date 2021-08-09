module.exports = (sequelize, Sequelize) => {
  const americasCup2021BoatLeg = sequelize.define(
    'AmericasCup2021BoatLeg',
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
      leg_interpolator_value: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      leg_interpolator_time: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
    },
    {
      tableName: 'AmericasCup2021BoatLegs',
      timestamps: false,
    },
  );
  return americasCup2021BoatLeg;
};

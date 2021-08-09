module.exports = (sequelize, Sequelize) => {
  const americasCup2021BoatRudderAngle = sequelize.define(
    'AmericasCup2021BoatRudderAngle',
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
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      leg_interpolator_time: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
    },
    {
      tableName: 'AmericasCup2021BoatRudderAngles',
      timestamps: false,
    },
  );
  return americasCup2021BoatRudderAngle;
};

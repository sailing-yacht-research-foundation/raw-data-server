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
      rudder_angle_value: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      rudder_angle_time: {
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

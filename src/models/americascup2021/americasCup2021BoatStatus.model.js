module.exports = (sequelize, Sequelize) => {
  const americasCup2021BoatStatus = sequelize.define(
    'AmericasCup2021BoatStatus',
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
      status_interpolator_value: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      status_interpolator_time: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
    },
    {
      tableName: 'AmericasCup2021BoatStatuses',
      timestamps: false,
    },
  );
  return americasCup2021BoatStatus;
};

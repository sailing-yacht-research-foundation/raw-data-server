module.exports = (sequelize, Sequelize) => {
  const americasCup2021RaceStatus = sequelize.define(
    'AmericasCup2021RaceStatus',
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
      race_status_interpolator_value: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      race_status_interpolator_time: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
    },
    {
      tableName: 'AmericasCup2021RaceStatuses',
      timestamps: false,
    },
  );
  return americasCup2021RaceStatus;
};

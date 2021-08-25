module.exports = (sequelize, Sequelize) => {
  const americasCupAvgWind = sequelize.define(
    'AmericasCupAvgWind',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      date: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      secs: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      local_time: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      zone: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      timestamp: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      instant: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      average: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      filename: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: 'AmericasCupAvgWinds',
      timestamps: false,
    },
  );
  return americasCupAvgWind;
};

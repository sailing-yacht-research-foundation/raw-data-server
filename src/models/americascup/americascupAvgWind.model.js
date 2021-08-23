module.exports = (sequelize, Sequelize) => {
  const americasCupAvgWind = sequelize.define(
    'AmericasCupAvgWind',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      race: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
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
      instant: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      average: {
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

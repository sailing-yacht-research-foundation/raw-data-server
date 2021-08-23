module.exports = (sequelize, Sequelize) => {
  const americasCupEvent = sequelize.define(
    'AmericasCupEvent',
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
      boat_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      boat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      boat_original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
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
      event: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      opt1: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      opt2: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'AmericasCupEvents',
      timestamps: false,
    },
  );
  return americasCupEvent;
};

module.exports = (sequelize, Sequelize) => {
  const raceQsEvent = sequelize.define(
    'RaceQsEvent',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      regatta: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      regatta_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      from: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      till: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      tz: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lat1: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lon1: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lat2: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lon2: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      updated_at: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'RaceQsEvents',
      timestamps: false,
    },
  );
  return raceQsEvent;
};

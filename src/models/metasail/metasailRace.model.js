module.exports = (sequelize, Sequelize) => {
  const metasailRace = sequelize.define(
    'MetasailRace',
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
      event: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      event_original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      stop: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      stats: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      passings: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'MetasailRaces',
      timestamps: false,
    },
  );
  return metasailRace;
};

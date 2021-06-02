module.exports = (sequelize, Sequelize) => {
  const raceQsStart = sequelize.define(
    'RaceQsStart',
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
        allowNull: false,
      },
      event_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      division: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      division_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      from: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      wind: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      min_duration: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'RaceQsStart',
      timestamps: false,
    },
  );
  return raceQsStart;
};

module.exports = (sequelize, Sequelize) => {
  const raceQsParticipant = sequelize.define(
    'RaceQsParticipant',
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
      boat: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      start: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      finish: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: 'RaceQsParticipants',
      timestamps: false,
    },
  );
  return raceQsParticipant;
};

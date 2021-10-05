module.exports = (sequelize, Sequelize) => {
  const iSailResult = sequelize.define(
    'iSailResult',
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
      original_event_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      race: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      original_race_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      points: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      finaled: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      participant: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      original_participant_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'iSailResults',
      timestamps: false,
    },
  );

  return iSailResult;
};

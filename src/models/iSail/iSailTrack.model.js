module.exports = (sequelize, Sequelize) => {
  const iSailTrack = sequelize.define(
    'iSailTrack',
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
      track_data: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      participant: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      original_participant_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      class: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      original_class_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      original_user_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      user_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start_time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      stop_time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'iSailTracks',
      timestamps: false,
    },
  );

  return iSailTrack;
};

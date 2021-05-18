module.exports = (sequelize, Sequelize) => {
  const iSailPosition = sequelize.define(
    'iSailPosition',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
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
      track: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      original_track_id: {
        type: Sequelize.TEXT,
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
        allowNull: false,
      },
      time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      speed: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      heading: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      distance: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'iSailPositions',
      timestamps: false,
    },
  );

  return iSailPosition;
};

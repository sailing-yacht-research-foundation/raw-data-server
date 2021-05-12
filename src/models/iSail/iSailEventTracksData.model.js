module.exports = (sequelize, Sequelize) => {
  const iSailEventTracksData = sequelize.define(
    'iSailEventTracksData',
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
      min_lon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      max_lon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      min_lat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      max_lat: {
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
      tableName: 'iSailEventTracksDatas',
      timestamps: false,
    },
  );

  return iSailEventTracksData;
};

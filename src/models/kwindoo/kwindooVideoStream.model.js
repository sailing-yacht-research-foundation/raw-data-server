module.exports = (sequelize, Sequelize) => {
  const kwindooVideoStream = sequelize.define(
    'KwindooVideoStream',
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
      source: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      video_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start_time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      end_time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start_timestamp: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      end_timestamp: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'KwindooVideoStreams',
      timestamps: false,
    },
  );
  return kwindooVideoStream;
};

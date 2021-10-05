module.exports = (sequelize, Sequelize) => {
  const yachtBotPosition = sequelize.define(
    'YachtBotPosition',
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
      yacht_or_buoy: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      yacht: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      yacht_original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      buoy: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      buoy_original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      time: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      lat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      gps_quality: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'YachtBotPositions',
      timestamps: false,
    },
  );
  return yachtBotPosition;
};

module.exports = (sequelize, Sequelize) => {
  const georacingRace = sequelize.define(
    'GeoracingRaces',
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
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      short_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      short_description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      time_zone: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      available_time: {
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
      url: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      player_version: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'GeoracingRaces',
      timestamps: false,
    },
  );

  return georacingRace;
};

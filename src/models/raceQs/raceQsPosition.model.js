module.exports = (sequelize, Sequelize) => {
  const raceQsPosition = sequelize.define(
    'RaceQsPosition',
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
      event_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      participant: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      participant_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      time: {
        type: Sequelize.TEXT,
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
      roll: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      pitch: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      heading: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sow: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      wind_angle: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      wind_speed: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'RaceQsPositions',
      timestamps: false,
    },
  );
  return raceQsPosition;
};

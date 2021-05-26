module.exports = (sequelize, Sequelize) => {
  const raceQsRoute = sequelize.define(
    'RaceQsRoute',
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
      start: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      start_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      waypoint: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      waypoint_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      sqk: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      wind_direction: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      wind_speed: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      current_direction: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      current_speed: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'RaceQsRoute',
      timestamps: false,
    },
  );
  return raceQsRoute;
};

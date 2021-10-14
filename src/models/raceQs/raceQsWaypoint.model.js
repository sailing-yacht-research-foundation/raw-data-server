module.exports = (sequelize, Sequelize) => {
  const raceQsWaypoint = sequelize.define(
    'RaceQsWaypoint',
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
      regatta: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      regatta_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      start: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      finish: {
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
      lat2: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lon2: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      port_course: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      port_speed: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      starboard_course: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      starboard_speed: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      wind: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      tack: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      v: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start_I: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      finish_I: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start_Z: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      finish_Z: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      race_type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      boat_model: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'RaceQsWaypoints',
      timestamps: false,
    },
  );
  return raceQsWaypoint;
};

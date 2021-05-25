module.exports = (sequelize, Sequelize) => {
  const kwindooWaypoint = sequelize.define(
    'KwindooWaypoint',
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
      race: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      primary_marker_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      secondary_marker_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      role: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      order_number: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      diameter: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      pass_direction: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      primary_marker_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      primary_marker_approach_radius: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      primary_marker_lat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      primary_marker_lon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      secondary_marker_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      secondary_marker_approach_radius: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      secondary_marker_lat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      secondary_marker_lon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'KwindooWaypoints',
      timestamps: false,
    },
  );
  return kwindooWaypoint;
};

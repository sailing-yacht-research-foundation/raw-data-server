module.exports = (sequelize, Sequelize) => {
  const estelaBuoy = sequelize.define(
    'EstelaBuoy',
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
      anchored_at: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      door: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      index: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      label: {
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
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      score: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      updated_at: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      waypoint: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      next_scoring_buoy: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      layline_angle: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      layline_distance: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      race: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      radius: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'EstelaBuoys',
      timestamps: false,
    },
  );
  return estelaBuoy;
};

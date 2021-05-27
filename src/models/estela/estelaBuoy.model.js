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
        primaryKey: false,
      },
      anchored_at: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      door: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        primaryKey: false,
      },
      index: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      label: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      lon: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      lat: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      score: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        primaryKey: false,
      },
      updated_at: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      waypoint: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        primaryKey: false,
      },
      next_scoring_buoy: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      layline_angle: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      layline_distance: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      race: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: false,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
        primaryKey: false,
      },
      radius: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
    },
    {
      tableName: 'EstelaBuoys',
      timestamps: false,
    },
  );
  return estelaBuoy;
};

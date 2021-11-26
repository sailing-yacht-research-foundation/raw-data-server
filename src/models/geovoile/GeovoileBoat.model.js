module.exports = (sequelize, Sequelize) => {
  const geovoileBoat = sequelize.define(
    'GeovoileBoat',
    {
      id: {
        type: Sequelize.TEXT,
        allowNull: false,
        primaryKey: true,
      },
      original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      race_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      short_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      hullColor: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      hulls: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      arrival: {
        type: Sequelize.JSON,
      },
    },
    {
      tableName: 'GeovoileBoats',
      timestamps: false,
    },
  );
  return geovoileBoat;
};

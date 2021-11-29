module.exports = (sequelize, Sequelize) => {
  const geovoileGeometryGate = sequelize.define(
    'GeovoileGeometryGate',
    {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV1,
        allowNull: false,
        primaryKey: true,
      },
      race_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      order: {
        type: Sequelize.INTEGER,
      },
      geometryType: {
        type: Sequelize.STRING,
      },
      coordinates: {
        type: Sequelize.JSON,
      },
      properties: {
        type: Sequelize.JSON,
      },
    },
    {
      tableName: 'GeovoileGeometryGate',
      timestamps: false,
    },
  );
  return geovoileGeometryGate;
};

module.exports = (sequelize, Sequelize) => {
  const geovoileGeometry = sequelize.define(
    'GeovoileGeometry',
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
      tableName: 'GeovoileGeometry',
      timestamps: false,
    },
  );
  return geovoileGeometry;
};

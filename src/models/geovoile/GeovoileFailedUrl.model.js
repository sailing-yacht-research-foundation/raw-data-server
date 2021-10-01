module.exports = (sequelize, Sequelize) => {
  const geovoileFailedUrl = sequelize.define(
    'GeovoileFailedUrl',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      url: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      error: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    },
    {
      tableName: 'GeovoileFailedUrls',
      timestamps: false,
    },
  );

  return geovoileFailedUrl;
};

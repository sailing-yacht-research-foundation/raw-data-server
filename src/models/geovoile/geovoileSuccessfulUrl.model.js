module.exports = (sequelize, Sequelize) => {
  const geovoileSuccessfulUrl = sequelize.define(
    'GeovoileSuccessfulUrl',
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
      original_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    },
    {
      tableName: 'GeovoileSuccessfulUrls',
      timestamps: false,
    },
  );
  return geovoileSuccessfulUrl;
};

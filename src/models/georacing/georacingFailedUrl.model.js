module.exports = (sequelize, Sequelize) => {
  const georacingFailedUrl = sequelize.define(
    'GeoracingFailedUrl',
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
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    },
    {
      tableName: 'GeoracingFailedUrls',
      timestamps: false,
    },
  );

  return georacingFailedUrl;
};

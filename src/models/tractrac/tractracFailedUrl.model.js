module.exports = (sequelize, Sequelize) => {
  const tractracFailedUrl = sequelize.define(
    'TracTracFailedUrl',
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
      tableName: 'TracTracFailedUrls',
      timestamps: false,
    },
  );

  return tractracFailedUrl;
};

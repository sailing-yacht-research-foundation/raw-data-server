module.exports = (sequelize, Sequelize) => {
  const bluewaterFailedUrl = sequelize.define(
    'BluewaterFailedUrl',
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
      tableName: 'BluewaterFailedUrls',
      timestamps: false,
    },
  );
  return bluewaterFailedUrl;
};

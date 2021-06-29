module.exports = (sequelize, Sequelize) => {
  const iSailFailedUrl = sequelize.define(
    'iSailFailedUrl',
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
      tableName: 'iSailFailedUrls',
      timestamps: false,
    },
  );
  return iSailFailedUrl;
};

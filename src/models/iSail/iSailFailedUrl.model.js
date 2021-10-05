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
      created_at: {
        type: Sequelize.DATE,
        allowNull: true,
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

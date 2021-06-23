module.exports = (sequelize, Sequelize) => {
  const yachtBotFailedUrl = sequelize.define(
    'YachtBotFailedUrl',
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
      tableName: 'YachtBotFailedUrls',
      timestamps: false,
    },
  );

  return yachtBotFailedUrl;
};
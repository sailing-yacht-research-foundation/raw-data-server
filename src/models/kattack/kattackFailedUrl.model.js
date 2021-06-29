module.exports = (sequelize, Sequelize) => {
  const kattackFailedUrl = sequelize.define(
    'KattackFailedUrl',
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
      tableName: 'KattackFailedUrls',
      timestamps: false,
    },
  );

  return kattackFailedUrl;
};

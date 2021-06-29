module.exports = (sequelize, Sequelize) => {
  const estelaFailedUrl = sequelize.define(
    'EstelaFailedUrl',
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
      tableName: 'EstelaFailedUrls',
      timestamps: false,
    },
  );
  return estelaFailedUrl;
};

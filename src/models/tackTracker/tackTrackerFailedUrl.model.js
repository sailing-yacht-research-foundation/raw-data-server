module.exports = (sequelize, Sequelize) => {
  const tackTrackerFailedUrl = sequelize.define(
    'TackTrackerFailedUrl',
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
      tableName: 'TackTrackerFailedUrls',
      timestamps: false,
    },
  );

  return tackTrackerFailedUrl;
};

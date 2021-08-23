module.exports = (sequelize, Sequelize) => {
  const swiftsureFailedUrl = sequelize.define(
    'SwiftsureFailedUrl',
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
      tableName: 'SwiftsureFailedUrls',
      timestamps: false,
    },
  );
  return swiftsureFailedUrl;
};

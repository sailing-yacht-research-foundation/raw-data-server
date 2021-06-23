module.exports = (sequelize, Sequelize) => {
  const kwindooSuccessfulUrl = sequelize.define(
    'KwindooSuccessfulUrl',
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
      original_id: {
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
      tableName: 'KwindooSuccessfulUrls',
      timestamps: false,
    },
  );
  return kwindooSuccessfulUrl;
};

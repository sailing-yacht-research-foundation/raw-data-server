module.exports = (sequelize, Sequelize) => {
  const tractracSuccessfulUrl = sequelize.define(
    'TracTracSuccessfulUrl',
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
      tableName: 'TracTracSuccessfulUrls',
      timestamps: false,
    },
  );
  return tractracSuccessfulUrl;
};

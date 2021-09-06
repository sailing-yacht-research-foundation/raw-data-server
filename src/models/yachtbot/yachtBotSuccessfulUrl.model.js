module.exports = (sequelize, Sequelize) => {
  const yachtBotSuccessfulUrl = sequelize.define(
    'YachtBotSuccessfulUrl',
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
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    },
    {
      tableName: 'YachtBotSuccessfulUrls',
      timestamps: false,
    },
  );
  return yachtBotSuccessfulUrl;
};

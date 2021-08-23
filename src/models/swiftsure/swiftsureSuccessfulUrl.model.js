module.exports = (sequelize, Sequelize) => {
  const swiftsureSuccessfulUrl = sequelize.define(
    'SwiftsureSuccessfulUrl',
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
      tableName: 'SwiftsureSuccessfulUrls',
      timestamps: false,
    },
  );
  return swiftsureSuccessfulUrl;
};

module.exports = (sequelize, Sequelize) => {
  const metasailSuccessfulUrl = sequelize.define(
    'MetasailSuccessfulUrl',
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
      tableName: 'MetasailSuccessfulUrls',
      timestamps: false,
    },
  );
  return metasailSuccessfulUrl;
};

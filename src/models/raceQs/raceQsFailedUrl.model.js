module.exports = (sequelize, Sequelize) => {
  const raceQsFailedUrl = sequelize.define(
    'RaceQsFailedUrl',
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
      tableName: 'RaceQsFailedUrls',
      timestamps: false,
    },
  );

  return raceQsFailedUrl;
};

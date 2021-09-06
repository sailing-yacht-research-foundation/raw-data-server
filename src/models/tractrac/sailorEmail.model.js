module.exports = (sequelize, Sequelize) => {
  const sailorEmail = sequelize.define(
    'SailorEmail',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      email: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      country: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      source: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: 'SailorEmails',
      timestamps: false,
    },
  );
  return sailorEmail;
};

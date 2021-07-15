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
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
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

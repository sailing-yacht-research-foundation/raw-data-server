module.exports = (sequelize, Sequelize) => {
  const estelaClub = sequelize.define(
    'EstelaClub',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
        primaryKey: false,
      },
      user_id: {
        type: Sequelize.TEXT,
        allowNull: false,
        primaryKey: false,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      lon: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      lat: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      timezone: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      website: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      twitter: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      api_token: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      phone: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      email: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
    },
    {
      tableName: 'EstelaClubs',
      timestamps: false,
    },
  );
  return estelaClub;
};

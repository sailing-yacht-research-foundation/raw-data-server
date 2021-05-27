module.exports = (sequelize, Sequelize) => {
  const estelaPlayer = sequelize.define(
    'EstelaPlayer',
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
      dorsal: {
        type: Sequelize.UUID,
        allowNull: true,
        primaryKey: false,
      },
      dorsal_original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      class: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      number: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      committee: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      race: {
        type: Sequelize.UUID,
        allowNull: true,
        primaryKey: false,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
    },
    {
      tableName: 'EstelaPlayers',
      timestamps: false,
    },
  );
  return estelaPlayer;
};

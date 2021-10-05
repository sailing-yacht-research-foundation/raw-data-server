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
      },
      dorsal: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      dorsal_original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      class: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      number: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      committee: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      race: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'EstelaPlayers',
      timestamps: false,
    },
  );
  return estelaPlayer;
};

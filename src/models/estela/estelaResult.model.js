module.exports = (sequelize, Sequelize) => {
  const estelaResult = sequelize.define(
    'EstelaResult',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      race: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      race_original_id: {
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
      laraval_through_key: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      timestamp: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'EstelaResults',
      timestamps: false,
    },
  );
  return estelaResult;
};

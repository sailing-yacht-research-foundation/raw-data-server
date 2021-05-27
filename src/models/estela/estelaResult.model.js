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
        primaryKey: false,
      },
      race_original_id: {
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
      laraval_through_key: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      timestamp: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
    },
    {
      tableName: 'EstelaResults',
      timestamps: false,
    },
  );
  return estelaResult;
};

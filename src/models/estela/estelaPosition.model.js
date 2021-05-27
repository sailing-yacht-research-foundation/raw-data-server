module.exports = (sequelize, Sequelize) => {
  const estelaPosition = sequelize.define(
    'EstelaPosition',
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
      lon: {
        type: Sequelize.TEXT,
        allowNull: false,
        primaryKey: false,
      },
      lat: {
        type: Sequelize.TEXT,
        allowNull: false,
        primaryKey: false,
      },
      timestamp: {
        type: Sequelize.TEXT,
        allowNull: false,
        primaryKey: false,
      },
      s: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      c: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      p: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      w: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      y: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
    },
    {
      tableName: 'EstelaPositions',
      timestamps: false,
    },
  );
  return estelaPosition;
};

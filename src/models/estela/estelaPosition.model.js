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
      lon: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      lat: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      timestamp: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      s: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      c: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      p: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      w: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      y: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'EstelaPositions',
      timestamps: false,
    },
  );
  return estelaPosition;
};

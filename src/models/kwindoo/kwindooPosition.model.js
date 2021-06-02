module.exports = (sequelize, Sequelize) => {
  const kwindooPosition = sequelize.define(
    'KwindooPosition',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      regatta: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      regatta_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      race: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      boat: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      boat_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      i: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      u: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      t: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      b: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      a: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      d: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      s: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      y: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'KwindooPositions',
      timestamps: false,
    },
  );
  return kwindooPosition;
};

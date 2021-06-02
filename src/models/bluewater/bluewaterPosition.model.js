module.exports = (sequelize, Sequelize) => {
  const bluewaterPosition = sequelize.define(
    'BluewaterPosition',
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
        allowNull: true,
      },
      boat_original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      boat_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      geometry_type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      coordinate_0: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      coordinate_1: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      coordinate_2: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      cog: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      date: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      device_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sog: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      source: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'BluewaterPositions',
      timestamps: false,
    },
  );
  return bluewaterPosition;
};

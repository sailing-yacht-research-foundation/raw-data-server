module.exports = (sequelize, Sequelize) => {
  const tractracControlPointPosition = sequelize.define(
    'TracTracControlPointPosition',
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
      route: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      route_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      controlpoint: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      lat: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      lon: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      height: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      speed: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      direction: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      m: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      timestamp: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      speed_avg: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'TracTracControlPointPositions',
      timestamps: false,
    },
  );
  return tractracControlPointPosition;
};

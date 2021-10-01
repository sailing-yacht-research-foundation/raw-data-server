module.exports = (sequelize, Sequelize) => {
  const oldGeovoilledBoatPosition = sequelize.define(
    'OldGeovoilledBoatPosition',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      race_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      boat_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      boat_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      lat: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      lon: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      timestamp: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
    },
    {
      tableName: 'OldGeovoilledBoatPositions',
      timestamps: false,
    },
  );
  return oldGeovoilledBoatPosition;
};

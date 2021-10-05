module.exports = (sequelize, Sequelize) => {
  const tackTrackerPosition = sequelize.define(
    'TackTrackerPosition',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      boat: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      race: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'TackTrackerPositions',
      timestamps: false,
    },
  );
  return tackTrackerPosition;
};

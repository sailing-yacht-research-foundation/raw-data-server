module.exports = (sequelize, Sequelize) => {
  const liveDataPoint = sequelize.define(
    'LiveDataPoint',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      location: {
        type: Sequelize.GEOMETRY('POINT', 4326),
        allowNull: false,
      },
      speed: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      heading: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      accuracy: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      altitude: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      tws: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      twa: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      stw: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      raceUnitId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      boatParticipantGroupId: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      boatId: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      deviceId: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      publicId: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'LiveDataPoints',
      timestamps: false,
    },
  );
  return liveDataPoint;
};

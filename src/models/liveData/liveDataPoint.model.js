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
      race_unit_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      boat_participant_group_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      boat_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      device_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      public_id: {
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

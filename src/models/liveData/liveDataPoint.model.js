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
      sog: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      cog: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      twa: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      set_drift: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      elapsed_time: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      competition_unit_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      vessel_participant_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      participant_id: {
        type: Sequelize.UUID,
        allowNull: false,
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

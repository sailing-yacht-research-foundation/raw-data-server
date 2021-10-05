module.exports = (sequelize, Sequelize) => {
  const yellowbrickPosition = sequelize.define(
    'YellowbrickPosition',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      race_code: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      race: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      team_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      team: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      pc: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      dtf_km: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      dtf_nm: {
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
      timestamp: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sog_kmph: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      tx_at: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      altitude: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      battery: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sog_knots: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      alert: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      cog: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      gps_at: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'YellowbrickPositions',
      timestamps: false,
    },
  );
  return yellowbrickPosition;
};

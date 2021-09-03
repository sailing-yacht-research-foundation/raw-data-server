module.exports = (sequelize, Sequelize) => {
  const sapCompetitorBoatPosition = sequelize.define(
    'SapCompetitorBoatPosition',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      competitor_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      competitor_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      race_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      competitor_boat_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      competitor_boat_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      timepoint_ms: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      lat_deg: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      lng_deg: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      truebearing_deg: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      speed_kts: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
    },
    {
      tableName: 'SapCompetitorBoatPositions',
      timestamps: false,
    },
  );
  return sapCompetitorBoatPosition;
};

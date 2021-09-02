module.exports = (sequelize, Sequelize) => {
  const sapCompetitorMarkPosition = sequelize.define(
    'SapCompetitorMarkPosition',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      race_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      mark_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      mark_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      timepoint_ms: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      lat_deg: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      lng_deg: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
    },
    {
      tableName: 'SapCompetitorMarkPositions',
      timestamps: false,
    },
  );
  return sapCompetitorMarkPosition;
};

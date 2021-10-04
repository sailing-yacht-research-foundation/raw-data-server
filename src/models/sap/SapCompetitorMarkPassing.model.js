module.exports = (sequelize, Sequelize) => {
  const sapCompetitorMarkPassing = sequelize.define(
    'SapCompetitorMarkPassing',
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
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      competitor_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      competitor_original_id: {
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
      waypoint_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      zero_based_waypoint_index: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      time_as_millis: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      time_as_iso: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: 'SapCompetitorMarkPassings',
      timestamps: false,
    },
  );
  return sapCompetitorMarkPassing;
};

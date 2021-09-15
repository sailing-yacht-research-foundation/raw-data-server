module.exports = (sequelize, Sequelize) => {
  const sapWindSummary = sequelize.define(
    'SapWindSummary',
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
      race_column: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      fleet: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      true_lower_bound_wind_in_knots: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      true_upperbound_wind_in_knots: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      true_wind_direction_in_degrees: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: 'SapWindSummarys',
      timestamps: false,
    },
  );
  return sapWindSummary;
};

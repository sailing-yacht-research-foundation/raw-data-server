module.exports = (sequelize, Sequelize) => {
  const tractracCompetitorResult = sequelize.define(
    'TracTracCompetitorResult',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      race: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      competitor: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      competitor_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      time_elapsed: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start_time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      stop_time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      finish_time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      team_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      team_original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'TracTracCompetitorResults',
      timestamps: false,
    },
  );
  return tractracCompetitorResult;
};

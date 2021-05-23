module.exports = (sequelize, Sequelize) => {
  const tractracCompetitorPassing = sequelize.define(
    'TracTracCompetitorPassing',
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
      control: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      control_original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      passing_time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      real_passing_time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      pos: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      time_from_start: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'TracTracCompetitorPassings',
      timestamps: false,
    },
  );
  return tractracCompetitorPassing;
};

module.exports = (sequelize, Sequelize) => {
  const yellowbrickTeam = sequelize.define(
    'YellowbrickTeam',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      race: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      race_code: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      owner: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      country: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      flag: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sail: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      tcf1: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      tcf2: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      tcf3: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      started: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      finished_at: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      captain: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      tags: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      max_laps: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      model: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      marker_text: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      explain: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'YellowbrickTeams',
      timestamps: false,
    },
  );
  return yellowbrickTeam;
};

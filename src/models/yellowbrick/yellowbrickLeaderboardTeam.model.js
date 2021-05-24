module.exports = (sequelize, Sequelize) => {
  const yellowbrickLeaderboardTeam = sequelize.define(
    'YellowbrickLeaderboardTeam',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      tag: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      tag_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      race_code: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      race: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      type: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      c_elapsed: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      old: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      d24: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      started: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      finished: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      elapsed: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      c_elapsed_formatted: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      rank_r: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      rank_s: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      tcf: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      dff: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      team_original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      team: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      finished_at: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      elapsed_formatted: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      dmg: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'YellowbrickLeaderboardTeams',
      timestamps: false,
    },
  );
  return yellowbrickLeaderboardTeam;
};

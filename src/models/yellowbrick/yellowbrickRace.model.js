module.exports = (sequelize, Sequelize) => {
  const yellowbrickRace = sequelize.define(
    'YellowbrickRace',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      tz: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      tz_offset: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lapz: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      laps: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      track_width: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      motd: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      associated2: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      associated: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      hashtag: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      stop: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      race_code: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      title: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      flag_stopped: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      super_lines: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      kml_s3_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      text_leaderboard: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      distance: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'YellowbrickRaces',
      timestamps: false,
    },
  );
  return yellowbrickRace;
};

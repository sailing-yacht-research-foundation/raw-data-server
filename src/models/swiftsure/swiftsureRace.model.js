module.exports = (sequelize, Sequelize) => {
  const SwiftsureRace = sequelize.define(
    'SwiftsureRace',
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
      welcome: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      race_start: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      course_bounds_n: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      course_bounds_s: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      course_bounds_e: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      course_bounds_w: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      home_bounds_n: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      home_bounds_s: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      home_bounds_e: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      home_bounds_w: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      fin_bounds_n: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      fin_bounds_s: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      fin_bounds_e: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      fin_bounds_w: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      timezone: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      track_type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      event_type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      update_interval: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      tag_interval: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      default_facebook: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'SwiftsureRaces',
      timestamps: false,
    },
  );
  return SwiftsureRace;
};

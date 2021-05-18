module.exports = (sequelize, Sequelize) => {
  const iSailRounding = sequelize.define(
    'iSailRounding',
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
      event: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      original_event_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      track: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      original_track_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      course_mark: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      original_course_mark_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      time_since_last_mark: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      distance_since_last_mark: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      rst: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      rsd: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      max_speed: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'iSailRoundings',
      timestamps: false,
    },
  );

  return iSailRounding;
};

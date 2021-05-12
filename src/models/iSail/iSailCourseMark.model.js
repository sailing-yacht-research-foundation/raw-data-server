module.exports = (sequelize, Sequelize) => {
  const iSailCourseMark = sequelize.define(
    'iSailCourseMark',
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
      race: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      original_race_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      position: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      mark: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      original_mark_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      startline: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      original_startline_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'iSailCourseMarks',
      timestamps: false,
    },
  );

  return iSailCourseMark;
};

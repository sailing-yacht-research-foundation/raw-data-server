module.exports = (sequelize, Sequelize) => {
  const georacingCourse = sequelize.define(
    'GeoracingCourses',
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
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      active: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      has_track: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      course_type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'GeoracingCourses',
      timestamps: false,
    },
  );

  return georacingCourse;
};

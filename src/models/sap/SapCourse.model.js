module.exports = (sequelize, Sequelize) => {
  const sapCourse = sequelize.define(
    'SapCourse',
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
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      course_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      passing_instruction: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      class: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      short_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      left_class: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      left_type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      right_class: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      right_type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'SapCourses',
      timestamps: false,
    },
  );
  return sapCourse;
};

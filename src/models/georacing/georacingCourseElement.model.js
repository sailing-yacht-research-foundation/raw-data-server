module.exports = (sequelize, Sequelize) => {
  const georacingCourseElement = sequelize.define(
    'GeoracingCourseElements',
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
      course: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      course_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      course_object: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      course_object_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      visible: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      distance: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      orientation_angle: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      course_element_type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      model: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      size: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      orientation_mode: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      longitude: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      latitude: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      altitude: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'GeoracingCourseElements',
      timestamps: false,
    },
  );

  return georacingCourseElement;
};

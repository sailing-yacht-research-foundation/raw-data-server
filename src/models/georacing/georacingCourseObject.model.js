module.exports = (sequelize, Sequelize) => {
  const georacingCourseObject = sequelize.define(
    'GeoracingCourseObjects',
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
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      short_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      order: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      raise_event: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      show_layline: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_image_reverse: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      altitude_max: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      altitude_min: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      circle_size: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      splittimes_visible: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      hide_on_timeline: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lap_number: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      distance: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      role: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      rounding: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      headline_orientation: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'GeoracingCourseObjects',
      timestamps: false,
    },
  );

  return georacingCourseObject;
};

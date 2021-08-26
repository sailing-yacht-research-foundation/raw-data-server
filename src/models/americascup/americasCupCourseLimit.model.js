module.exports = (sequelize, Sequelize) => {
  const americasCupCourseLimit = sequelize.define(
    'AmericasCupCourseLimit',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      seq_id: {
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
      lat: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      lon: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      time_created: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: 'AmericasCupCourseLimits',
      timestamps: false,
    },
  );
  return americasCupCourseLimit;
};

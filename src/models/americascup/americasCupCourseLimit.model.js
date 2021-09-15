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
        type: Sequelize.STRING,
        allowNull: false,
        unique: 'seq_id_race_original_id_constraint',
      },
      race: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: 'seq_id_race_original_id_constraint',
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
        allowNull: true,
      },
    },
    {
      tableName: 'AmericasCupCourseLimits',
      timestamps: false,
    },
  );
  return americasCupCourseLimit;
};

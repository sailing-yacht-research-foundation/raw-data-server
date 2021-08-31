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
      },
      race: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.STRING,
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
        allowNull: true,
      },
    },
    {
      tableName: 'AmericasCupCourseLimits',
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ['seq_id', 'race_original_id'],
        },
      ],
    },
  );
  return americasCupCourseLimit;
};

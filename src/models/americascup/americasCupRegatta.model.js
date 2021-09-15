module.exports = (sequelize, Sequelize) => {
  const americasCupRegatta = sequelize.define(
    'AmericasCupRegatta',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      original_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      course_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      central_lat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      central_lon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      central_altitude: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      utc_offset: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      magnetic_variation: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      shoreline_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'AmericasCupRegattas',
      timestamps: false,
    },
  );
  return americasCupRegatta;
};

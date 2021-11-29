module.exports = (sequelize, Sequelize) => {
  const geovoileMark = sequelize.define(
    'GeovoileMark',
    {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV1,
        allowNull: false,
        primaryKey: true,
      },
      race_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      lon: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      lat: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      xy: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: true,
      },
    },
    {
      tableName: 'GeovoileMarks',
      timestamps: false,
    },
  );
  return geovoileMark;
};

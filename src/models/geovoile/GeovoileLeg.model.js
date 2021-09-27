module.exports = (sequelize, Sequelize) => {
  const geovoileLeg = sequelize.define(
    'GeovoileLeg',
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
        allowNull: true,
      },
      legNum: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      raceState: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      startTime: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      endTime: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      isGame:{
        type: Sequelize.BOOLEAN,
        allowNull: true,
      }
    },
    {
      tableName: 'GeovoileLegs',
      timestamps: false,
    },
  );
  return geovoileLeg;
};

module.exports = (sequelize, Sequelize) => {
  const oldGeovoileRace = sequelize.define(
    'OldGeovoileRace',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      url: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      start_time: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: 'OldGeovoileRaces',
      timestamps: false,
    },
  );
  return oldGeovoileRace;
};

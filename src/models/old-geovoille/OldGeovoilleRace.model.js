module.exports = (sequelize, Sequelize) => {
  const oldGeovoilleRace = sequelize.define(
    'OldGeovoilleRace',
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
      tableName: 'OldGeovoilleRaces',
      timestamps: false,
    },
  );
  return oldGeovoilleRace;
};

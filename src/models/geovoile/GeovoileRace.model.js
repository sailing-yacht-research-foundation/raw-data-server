module.exports = (sequelize, Sequelize) => {
  const geovoileRace = sequelize.define(
    'GeovoileRace',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      original_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      legNum: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      numLegs: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      url: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      scrapedUrl: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      raceState: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      eventState: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      prerace: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      startTime: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      endTime: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      isGame: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
    },
    {
      tableName: 'GeovoileRaces',
      timestamps: false,
    },
  );
  return geovoileRace;
};

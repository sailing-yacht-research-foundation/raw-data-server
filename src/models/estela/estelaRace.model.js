module.exports = (sequelize, Sequelize) => {
  const estelaRace = sequelize.define(
    'EstelaRace',
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
      initLon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      initLat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      end: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      end_timestamp: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      ended_at: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      has_ended: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      has_started: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      length: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      offset: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      onset: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      onset_timestamp: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      scheduled_timestamp: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start_timestamp: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      gpx: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      winds_csv: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      leg_winds_csv: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
      },
      results_csv: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
      },
      club: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      club_original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'EstelaRaces',
      timestamps: false,
    },
  );
  return estelaRace;
};

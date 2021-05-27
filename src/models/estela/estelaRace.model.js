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
        primaryKey: false,
      },
      initLon: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      initLat: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      end: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      end_timestamp: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      ended_at: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      has_ended: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      has_started: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      length: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      offset: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      onset: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      onset_timestamp: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      scheduled_timestamp: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      start: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      start_timestamp: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      url: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      gpx: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      winds_csv: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      leg_winds_csv: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      results_csv: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      club: {
        type: Sequelize.UUID,
        allowNull: true,
        primaryKey: false,
      },
      club_original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
    },
    {
      tableName: 'EstelaRaces',
      timestamps: false,
    },
  );
  return estelaRace;
};

module.exports = (sequelize, Sequelize) => {
  const regadataReport = sequelize.define(
    'RegadataReport',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      original_object_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      race_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      rank: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      country: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sail_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      sail: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      skipper: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      boat: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      source: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      class: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      date: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      timestamp: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      lat_dms: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      lon_dms: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      lat_dec: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      lon_dec: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      '1hour_heading': {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      '1hour_speed': {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      '1hour_vmg': {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      '1hour_distance': {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      lastreport_heading: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      lastreport_speed: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      lastreport_vmg: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      lastreport_distance: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      '24hour_heading': {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      '24hour_speed': {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      '24hour_vmg': {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      '24hour_distance': {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      dtf: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      dtl: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      total_distance: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      dtl_diff: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      color: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'RegadataReports',
      timestamps: false,
    },
  );
  return regadataReport;
};

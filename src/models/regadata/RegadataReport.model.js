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
        allowNull: false,
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
        allowNull: false,
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
        allowNull: false,
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
        allowNull: false,
      },
      lon_dec: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      '1hour_heading': {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      '1hour_speed': {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      '1hour_vmg': {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      '1hour_distance': {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      lastreport_heading: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      lastreport_speed: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      lastreport_vmg: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      lastreport_distance: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      '24hour_heading': {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      '24hour_speed': {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      '24hour_vmg': {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      '24hour_distance': {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      dtf: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      dtl: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      total_distance: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      dtl_diff: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      color: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
    },
    {
      tableName: 'RegadataReports',
      timestamps: false,
    },
  );
  return regadataReport;
};

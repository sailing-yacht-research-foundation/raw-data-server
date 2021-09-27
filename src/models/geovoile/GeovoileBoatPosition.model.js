module.exports = (sequelize, Sequelize) => {
  const geovoileBoatPosition = sequelize.define(
    'GeovoileBoatPosition',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      boat_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      boat_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      race_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      command: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      crossing_antimeridian: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      dt_a: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      dt_b: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      heading: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      lat: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      lon: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      timecode: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      d_lat: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      d_lon: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
    },
    {
      tableName: 'GeovoileBoatPositions',
      timestamps: false,
    },
  );
  return geovoileBoatPosition;
};
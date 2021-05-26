module.exports = (sequelize, Sequelize) => {
  const metasailPosition = sequelize.define(
    'MetasailPosition',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      race: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      event: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      event_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      boat: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      boat_original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      buoy: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      buoy_original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      time: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      lon: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      lat: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      speed: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      lon_metri_const: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lat_metri_const: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      rank: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      distance_to_first_boat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      wind_state: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      wind_direction: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      slope_rank_line: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      end_time_difference: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      begin_date_time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      crt_race_segment: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      apply_wind: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      vmc: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      vmg: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      orientation: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'MetasailPositions',
      timestamps: false,
    },
  );
  return metasailPosition;
};

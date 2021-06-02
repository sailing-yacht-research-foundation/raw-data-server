module.exports = (sequelize, Sequelize) => {
  const kattackPosition = sequelize.define(
    'KattackPosition',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      device: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      original_device_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      race: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      original_race_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      time: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      speed_kts: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      distance_nm: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      heading_deg: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      epoch_offset_sec: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
    },
    {
      tableName: 'KattackPositions',
      timestamps: false,
    },
  );

  return kattackPosition;
};

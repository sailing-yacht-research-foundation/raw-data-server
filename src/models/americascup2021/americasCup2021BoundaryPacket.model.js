module.exports = (sequelize, Sequelize) => {
  const americasCup2021BoundaryPacket = sequelize.define(
    'AmericasCup2021BoundaryPacket',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      race_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      packet_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      coordinate_interpolator_lon: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      coordinate_interpolator_lat: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
    },
    {
      tableName: 'AmericasCup2021BoundaryPackets',
      timestamps: false,
    },
  );
  return americasCup2021BoundaryPacket;
};

module.exports = (sequelize, Sequelize) => {
  const yachtBotBuoy = sequelize.define(
    'YachtBotBuoy',
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
      race: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      buoy_type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      connected_buoy: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      connected_buoy_original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      metas: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      original_object_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'YachtBotBuoys',
      timestamps: false,
    },
  );
  return yachtBotBuoy;
};

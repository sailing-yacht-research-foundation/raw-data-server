module.exports = (sequelize, Sequelize) => {
  const metasailBuoy = sequelize.define(
    'MetasailBuoy',
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
      original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      initials: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lat_m: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lon_m: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'MetasailBuoys',
      timestamps: false,
    },
  );
  return metasailBuoy;
};

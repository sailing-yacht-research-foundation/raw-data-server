module.exports = (sequelize, Sequelize) => {
  const americasCupBoat = sequelize.define(
    'AmericasCupBoat',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      original_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      shape_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      type: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      ack: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      ip_address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      stowe_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      short_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      shorter_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      boat_name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      hull_num: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      skipper: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      flag: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      peli_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      radio_ip: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'AmericasCupBoats',
      timestamps: false,
    },
  );
  return americasCupBoat;
};

module.exports = (sequelize, Sequelize) => {
  const metasailGate = sequelize.define(
    'MetasailGate',
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
      buoy_1: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      buoy_1_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      buoy_2: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      buoy_2_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: 'MetasailGates',
      timestamps: false,
    },
  );
  return metasailGate;
};

module.exports = (sequelize, Sequelize) => {
  const SwiftsurePosition = sequelize.define(
    'SwiftsurePosition',
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
      boat: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      boat_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      timestamp: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      lat: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      lon: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      speed: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      heading: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      stat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      dtg: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'SwiftsurePositions',
      timestamps: false,
    },
  );
  return SwiftsurePosition;
};

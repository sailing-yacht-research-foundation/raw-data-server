module.exports = (sequelize, Sequelize) => {
  const SwiftsureLine = sequelize.define(
    'SwiftsureLine',
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
      lat1: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      lon1: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      lat2: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      lon2: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: 'SwiftsureLines',
      timestamps: false,
    },
  );
  return SwiftsureLine;
};

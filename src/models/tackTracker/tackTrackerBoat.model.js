module.exports = (sequelize, Sequelize) => {
  const tackTrackerBoat = sequelize.define(
    'TackTrackerBoat',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      race: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      details: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      color: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      unknown_1: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      unknown_2: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      unknown_3: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      unknown_4: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      unknown_5: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      unknown_6: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'TackTrackerBoats',
      timestamps: false,
    },
  );
  return tackTrackerBoat;
};

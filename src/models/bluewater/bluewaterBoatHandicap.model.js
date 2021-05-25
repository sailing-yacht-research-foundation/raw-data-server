module.exports = (sequelize, Sequelize) => {
  const bluewaterBoatHandicap = sequelize.define(
    'BluewaterBoatHandicap',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      boat: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      boat_original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      rating: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      division: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'BluewaterBoatHandicaps',
      timestamps: false,
    },
  );
  return bluewaterBoatHandicap;
};

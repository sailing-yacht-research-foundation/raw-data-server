module.exports = (sequelize, Sequelize) => {
  const kattackYachtClub = sequelize.define(
    'kattackYachtClub',
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
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      external_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'kattackYachtClubs',
      timestamps: false,
    },
  );

  return kattackYachtClub;
};

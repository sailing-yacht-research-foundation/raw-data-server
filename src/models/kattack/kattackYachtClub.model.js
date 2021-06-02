module.exports = (sequelize, Sequelize) => {
  const kattackYachtClub = sequelize.define(
    'KattackYachtClub',
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
      tableName: 'KattackYachtClubs',
      timestamps: false,
    },
  );

  return kattackYachtClub;
};

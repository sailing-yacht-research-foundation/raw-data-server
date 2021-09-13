module.exports = (sequelize, Sequelize) => {
  const regadataRace = sequelize.define(
    'RegadataRace',
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
    },
    {
      tableName: 'RegadataRaces',
      timestamps: false,
    },
  );
  return regadataRace;
};

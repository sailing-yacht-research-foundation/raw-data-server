module.exports = (sequelize, Sequelize) => {
  const raceQsDivision = sequelize.define(
    'RaceQsDivision',
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
      event: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      event_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      regatta: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      regatta_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      avatar: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'RaceQsDivision',
      timestamps: false,
    },
  );
  return raceQsDivision;
};

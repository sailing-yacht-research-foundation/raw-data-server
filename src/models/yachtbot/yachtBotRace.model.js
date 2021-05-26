module.exports = (sequelize, Sequelize) => {
  const yachtBotRace = sequelize.define(
    'YachtBotRace',
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
      name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      start_time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      end_time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      manual_wind: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      course_direction: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'YachtBotRaces',
      timestamps: false,
    },
  );
  return yachtBotRace;
};

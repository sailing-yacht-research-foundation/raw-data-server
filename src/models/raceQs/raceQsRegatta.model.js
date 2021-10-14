module.exports = (sequelize, Sequelize) => {
  const raceQsRegatta = sequelize.define(
    'RaceQsRegatta',
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
      club_original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      attach1: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      attach2: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      attach3: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      attach4: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      administrator: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      updated_at: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      contactor_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      contactor_email: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'RaceQsRegattas',
      timestamps: false,
    },
  );
  return raceQsRegatta;
};

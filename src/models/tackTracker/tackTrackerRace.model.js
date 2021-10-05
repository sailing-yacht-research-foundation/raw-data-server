module.exports = (sequelize, Sequelize) => {
  const tackTrackerRace = sequelize.define(
    'TackTrackerRace',
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
      url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      regatta: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      user: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      regatta_original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      user_original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      state: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      finish_at_start: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      span: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      course: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      event_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      course_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      upload_params: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'TackTrackerRaces',
      timestamps: false,
    },
  );
  return tackTrackerRace;
};

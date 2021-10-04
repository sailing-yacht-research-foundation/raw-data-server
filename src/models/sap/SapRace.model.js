module.exports = (sequelize, Sequelize) => {
  const sapRace = sequelize.define(
    'SapRace',
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
      regatta: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      scoring_system: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      ranking_metric: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      boat_class: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      can_boats_of_competitors_change_per_race: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      competitor_registration_type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      user_start_time_inference: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      control_tracking_from_start_and_finish_times: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      start_of_race_ms: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      start_of_tracking_ms: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      newest_tracking_event_ms: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      end_of_tracking_ms: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      end_of_race_ms: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      delay_to_live_ms: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
    },
    {
      tableName: 'SapRaces',
      timestamps: false,
    },
  );
  return sapRace;
};

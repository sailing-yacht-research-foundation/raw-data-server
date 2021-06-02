module.exports = (sequelize, Sequelize) => {
  const georacingActor = sequelize.define(
    'GeoracingActor',
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
      race: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      race_original_id: {
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
      tracker_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      tracker2_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      id_provider_actor: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      team_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      profile_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start_number: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      first_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      middle_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      last_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      big_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      short_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      members: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      active: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      visible: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      orientation_angle: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start_time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      has_penality: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sponsor_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start_order: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      rating: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      penality: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      penality_time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      capital1: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      capital2: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_security: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      full_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      categories: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      categories_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      all_info: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      nationality: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      model: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      size: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      team: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      orientation_mode: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      id_provider_tracker: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      id_provider_tracker2: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      states: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      person: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'GeoracingActors',
      timestamps: false,
    },
  );

  return georacingActor;
};

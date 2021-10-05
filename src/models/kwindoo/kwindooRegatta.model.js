module.exports = (sequelize, Sequelize) => {
  const kwindooRegatta = sequelize.define(
    'KwindooRegatta',
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
      owner: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      owner_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      timezone: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      public: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      private: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      sponsor: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      display_waypoint_pass_radius: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      name_slug: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      first_start_time: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      last_end_time: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      updated_at_timestamp: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      regatta_logo_path: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      featured_background_path: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      sponsor_logo_path: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: 'KwindooRegattas',
      timestamps: false,
    },
  );
  return kwindooRegatta;
};

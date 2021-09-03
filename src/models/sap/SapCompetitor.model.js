module.exports = (sequelize, Sequelize) => {
  const sapCompetitor = sequelize.define(
    'SapCompetitor',
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
        allowNull: false,
      },
      short_name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      display_color: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      search_tag: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      nationality: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      nationality_iso2: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      nationality_iso3: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      flag_image_uri: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      time_on_time_factor: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      time_on_distance_allowance_in_seconds_per_nautical_mile: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
    },
    {
      tableName: 'SapCompetitors',
      timestamps: false,
    },
  );
  return sapCompetitor;
};

module.exports = (sequelize, Sequelize) => {
  const tractracCompetitor = sequelize.define(
    'TracTracCompetitor',
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
      race: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      class: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      class_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      classrace_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      class_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      handicap: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      handicap_distance: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start_time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      finish_time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      stop_time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status_original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status_full: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status_time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      first_name: {
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
      short_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      name_alias: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      short_alias: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      nationality: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      non_competing: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      handicap_tod: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      handicap_tot: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'TracTracCompetitors',
      timestamps: false,
    },
  );
  return tractracCompetitor;
};

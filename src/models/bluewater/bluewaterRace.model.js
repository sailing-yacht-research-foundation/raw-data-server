module.exports = (sequelize, Sequelize) => {
  const bluewaterRace = sequelize.define(
    'BluewaterRace',
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
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      referral_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start_time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      timezone_location: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      timezone_offset: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      finish_timezone_location: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      finish_timezone_offset: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      track_time_start: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      track_time_finish: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      account_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      account_website: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      calculation: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      slug: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'BluewaterRaces',
      timestamps: false,
    },
  );
  return bluewaterRace;
};

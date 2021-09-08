module.exports = (sequelize, Sequelize) => {
  const regadataSail = sequelize.define(
    'RegadataSail',
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
      race_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      sail: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      skipper: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      boat: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      color: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      class: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      twitter: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      twitter2: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      twitter_skipper1: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      twitter_skipper2: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      twitter_sponsor: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      url_skipper1: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      url_skipper2: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      url_sponsor: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      fb_skipper1: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      fb_skipper2: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      fb_sponsor: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      youtube_skipper1: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      youtube_skipper2: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      youtube_sponsor: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'RegadataSails',
      timestamps: false,
    },
  );
  return regadataSail;
};

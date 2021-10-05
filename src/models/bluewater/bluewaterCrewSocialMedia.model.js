module.exports = (sequelize, Sequelize) => {
  const bluewaterCrewSocialMedia = sequelize.define(
    'BluewaterCrewSocialMedia',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      crew: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      url: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: 'BluewaterCrewSocialMedias',
      timestamps: false,
    },
  );
  return bluewaterCrewSocialMedia;
};

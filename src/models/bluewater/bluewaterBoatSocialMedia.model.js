module.exports = (sequelize, Sequelize) => {
  const bluewaterBoatSocialMedia = sequelize.define(
    'BluewaterBoatSocialMedia',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      race: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      boat: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      boat_original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      icon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'BluewaterBoatSocialMedias',
      timestamps: false,
    },
  );
  return bluewaterBoatSocialMedia;
};

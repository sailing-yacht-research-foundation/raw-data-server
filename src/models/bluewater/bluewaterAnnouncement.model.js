module.exports = (sequelize, Sequelize) => {
  const bluewaterAnnouncement = sequelize.define(
    'BluewaterAnnouncement',
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
      html: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'BluewaterAnnouncements',
      timestamps: false,
    },
  );
  return bluewaterAnnouncement;
};

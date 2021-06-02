module.exports = (sequelize, Sequelize) => {
  const bluewaterBoatCrew = sequelize.define(
    'BluewaterBoatCrew',
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
      role: {
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
      image_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      country_code: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      country_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'BluewaterBoatCrews',
      timestamps: false,
    },
  );
  return bluewaterBoatCrew;
};

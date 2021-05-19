module.exports = (sequelize, Sequelize) => {
  const georacingGroundPlace = sequelize.define(
    'georacingGroundPlaces',
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
      place_or_ground: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      size: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      zoom_min: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      zoom_max: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'georacingGroundPlaces',
      timestamps: false,
    },
  );

  return georacingGroundPlace;
};

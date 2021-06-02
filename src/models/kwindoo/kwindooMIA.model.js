module.exports = (sequelize, Sequelize) => {
  const kwindooMIA = sequelize.define(
    'KwindooMIA',
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
        type: Sequelize.UUID,
        allowNull: false,
      },
      regatta_original_id: {
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
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      northeast_lat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      northeast_lon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      southwest_lat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      southwest_lon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      rotation: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'KwindooMIAs',
      timestamps: false,
    },
  );
  return kwindooMIA;
};

module.exports = (sequelize, Sequelize) => {
  const kwindooHomeportLocation = sequelize.define(
    'KwindooHomeportLocation',
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
      country: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      state: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      city: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      zip: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      notice: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'KwindooHomeportLocations',
      timestamps: false,
    },
  );
  return kwindooHomeportLocation;
};

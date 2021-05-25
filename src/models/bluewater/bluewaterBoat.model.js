module.exports = (sequelize, Sequelize) => {
  const bluewaterBoat = sequelize.define(
    'BluewaterBoat',
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
      mmsi: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      skipper: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sail_no: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      design: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      length: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      width: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      units: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      draft: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      country_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      country_code: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      finish_time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'BluewaterBoats',
      timestamps: false,
    },
  );
  return bluewaterBoat;
};

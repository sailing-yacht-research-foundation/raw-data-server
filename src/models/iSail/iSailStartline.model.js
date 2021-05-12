module.exports = (sequelize, Sequelize) => {
  const iSailStartline = sequelize.define(
    'iSailStartline',
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
      event: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      original_event_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      race: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      original_race_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lon_1: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lat_1: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lon_2: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lat_2: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'iSailStartlines',
      timestamps: false,
    },
  );

  return iSailStartline;
};

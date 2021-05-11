module.exports = (sequelize, Sequelize) => {
  const iSailEvent = sequelize.define(
    'iSailEvent',
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
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start_date: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start_timezone_type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start_timezone: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      stop_date: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      stop_timezone_type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      stop_timezone: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      club: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      location: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'iSailEvents',
      timestamps: false,
    },
  );

  return iSailEvent;
};

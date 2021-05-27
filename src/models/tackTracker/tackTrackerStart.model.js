module.exports = (sequelize, Sequelize) => {
  const tackTrackerStart = sequelize.define(
    'TackTrackerStart',
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
      start_mark_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start_mark_lat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start_mark_lon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start_mark_type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start_pin_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start_pin_lat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start_pin_lon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start_pin_type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'TackTrackerStarts',
      timestamps: false,
    },
  );
  return tackTrackerStart;
};

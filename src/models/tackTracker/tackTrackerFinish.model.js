module.exports = (sequelize, Sequelize) => {
  const tackTrackerFinish = sequelize.define(
    'TackTrackerFinish',
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
      finish_mark_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      finish_mark_lat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      finish_mark_lon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      finish_mark_type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      finish_pin_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      finish_pin_lat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      finish_pin_lon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      finish_pin_type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'TackTrackerFinishes',
      timestamps: false,
    },
  );
  return tackTrackerFinish;
};

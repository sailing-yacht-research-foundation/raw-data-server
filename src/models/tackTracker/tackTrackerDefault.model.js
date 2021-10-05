module.exports = (sequelize, Sequelize) => {
  const tackTrackerDefault = sequelize.define(
    'TackTrackerDefault',
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
      lon: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      lat: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      color: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      trim: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'TackTrackerDefaults',
      timestamps: false,
    },
  );
  return tackTrackerDefault;
};

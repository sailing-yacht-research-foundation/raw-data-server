module.exports = (sequelize, Sequelize) => {
  const tackTrackerMark = sequelize.define(
    'TackTrackerMark',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      race: {
        type: Sequelize.UUID,
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
      type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'TackTrackerMarks',
      timestamps: false,
    },
  );
  return tackTrackerMark;
};

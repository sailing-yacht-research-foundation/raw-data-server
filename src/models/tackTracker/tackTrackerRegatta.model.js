module.exports = (sequelize, Sequelize) => {
  const tackTrackerRegatta = sequelize.define(
    'TackTrackerRegatta',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'TackTrackerRegattas',
      timestamps: false,
    },
  );
  return tackTrackerRegatta;
};

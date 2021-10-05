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
        allowNull: false,
      },
      original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: 'TackTrackerRegattas',
      timestamps: false,
    },
  );
  return tackTrackerRegatta;
};

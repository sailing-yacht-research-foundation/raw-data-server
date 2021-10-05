module.exports = (sequelize, Sequelize) => {
  const kwindooRunningGroup = sequelize.define(
    'KwindooRunningGroup',
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
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'KwindooRunningGroups',
      timestamps: false,
    },
  );
  return kwindooRunningGroup;
};

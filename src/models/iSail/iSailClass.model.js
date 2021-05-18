module.exports = (sequelize, Sequelize) => {
  const iSailClass = sequelize.define(
    'iSailClasses',
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
    },
    {
      tableName: 'iSailClasses',
      timestamps: false,
    },
  );

  return iSailClass;
};

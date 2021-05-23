module.exports = (sequelize, Sequelize) => {
  const tractracClass = sequelize.define(
    'TracTracClass',
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
        allowNull: false,
      },
    },
    {
      tableName: 'TracTracClasses',
      timestamps: false,
    },
  );
  return tractracClass;
};

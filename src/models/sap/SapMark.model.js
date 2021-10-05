module.exports = (sequelize, Sequelize) => {
  const sapMark = sequelize.define(
    'SapMark',
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
      race_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: 'SapMarks',
      timestamps: false,
    },
  );
  return sapMark;
};

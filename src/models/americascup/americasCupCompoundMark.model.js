module.exports = (sequelize, Sequelize) => {
  const americasCupCompoundMark = sequelize.define(
    'AmericasCupCompoundMark',
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
      seq_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      race: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      rounding: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      zone_size: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'AmericasCupCompoundMarks',
      timestamps: false,
    },
  );
  return americasCupCompoundMark;
};
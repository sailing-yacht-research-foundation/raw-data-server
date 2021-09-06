module.exports = (sequelize, Sequelize) => {
  const americasCupMark = sequelize.define(
    'AmericasCupMark',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      original_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: 'original_compound_mark_race_constraint',
      },
      race: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: 'original_compound_mark_race_constraint',
      },
      compound_mark: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      compound_mark_original_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: 'original_compound_mark_race_constraint',
      },
      seq_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lat: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      lon: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: 'AmericasCupMarks',
      timestamps: false,
    },
  );
  return americasCupMark;
};

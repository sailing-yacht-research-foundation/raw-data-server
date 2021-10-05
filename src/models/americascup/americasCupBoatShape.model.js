module.exports = (sequelize, Sequelize) => {
  const americasCupBoatShape = sequelize.define(
    'AmericasCupBoatShape',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      original_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: 'original_id_year_part_seq_constraint',
      },
      year: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: 'original_id_year_part_seq_constraint',
      },
      part: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: 'original_id_year_part_seq_constraint',
      },
      seq: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: 'original_id_year_part_seq_constraint',
      },
      y: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      x: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: 'AmericasCupBoatShapes',
      timestamps: false,
    },
  );
  return americasCupBoatShape;
};

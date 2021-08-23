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
        unique: true,
      },
      seq: {
        type: Sequelize.TEXT,
        allowNull: false,
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

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
      },
      year: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      part: {
        type: Sequelize.TEXT,
        allowNull: false,
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
      indexes: [
        {
          unique: true,
          fields: ['original_id', 'year'],
        },
      ],
    },
  );
  return americasCupBoatShape;
};

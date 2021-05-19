module.exports = (sequelize, Sequelize) => {
  const georacingLine = sequelize.define(
    'georacingLines',
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
      race: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      close: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      percent_factor: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      stroke_dasharray: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      points: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'georacingLines',
      timestamps: false,
    },
  );

  return georacingLine;
};

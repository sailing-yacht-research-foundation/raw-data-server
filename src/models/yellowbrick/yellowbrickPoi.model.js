module.exports = (sequelize, Sequelize) => {
  const yellowbrickPoi = sequelize.define(
    'YellowbrickPoi',
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
      race_code: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      race: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      nodes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      polygon: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'YellowbrickPois',
      timestamps: false,
    },
  );
  return yellowbrickPoi;
};

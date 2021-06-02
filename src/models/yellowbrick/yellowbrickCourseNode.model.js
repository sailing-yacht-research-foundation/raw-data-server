module.exports = (sequelize, Sequelize) => {
  const yellowbrickCourseNode = sequelize.define(
    'YellowbrickCourseNode',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      race_code: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      race: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      order: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      lat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'YellowbrickCourseNodes',
      timestamps: false,
    },
  );
  return yellowbrickCourseNode;
};

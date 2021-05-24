module.exports = (sequelize, Sequelize) => {
  const yellowbrickTag = sequelize.define(
    'YellowbrickTag',
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
      race_code: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      lb: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      handicap: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      laps: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sort: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'YellowbrickTags',
      timestamps: false,
    },
  );
  return yellowbrickTag;
};

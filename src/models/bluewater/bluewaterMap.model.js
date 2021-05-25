module.exports = (sequelize, Sequelize) => {
  const bluewaterMap = sequelize.define(
    'BluewaterMap',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      race: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      center_lon: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      center_lat: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      start_line: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      finish_line: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      course: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      regions: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'BluewaterMaps',
      timestamps: false,
    },
  );
  return bluewaterMap;
};

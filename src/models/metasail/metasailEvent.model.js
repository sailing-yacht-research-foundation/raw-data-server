module.exports = (sequelize, Sequelize) => {
  const metasailEvent = sequelize.define(
    'MetasailEvent',
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
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      external_website: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      url: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      category_text: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      end: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'MetasailEvents',
      timestamps: false,
    },
  );
  return metasailEvent;
};

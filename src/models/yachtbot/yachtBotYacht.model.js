module.exports = (sequelize, Sequelize) => {
  const yachtBotYacht = sequelize.define(
    'YachtBotYacht',
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
      boat_number: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      crew: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      country: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      metas: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      original_object_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'YachtBotYachts',
      timestamps: false,
    },
  );
  return yachtBotYacht;
};

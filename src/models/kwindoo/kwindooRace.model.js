module.exports = (sequelize, Sequelize) => {
  const kwindooRace = sequelize.define(
    'KwindooRace',
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
      regatta: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      regatta_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start_time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      end_time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start_timestamp: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      end_timestamp: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      running_group_ids: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      url: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: 'KwindooRaces',
      timestamps: false,
    },
  );
  return kwindooRace;
};

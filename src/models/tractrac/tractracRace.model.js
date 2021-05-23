module.exports = (sequelize, Sequelize) => {
  const tractracRace = sequelize.define(
    'TracTracRace',
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
      event: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      event_original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      url: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      tracking_start: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      tracking_stop: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      race_start: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      race_end: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      calculated_start_time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      race_handicap: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'TracTracRaces',
      timestamps: false,
    },
  );
  return tractracRace;
};

module.exports = (sequelize, Sequelize) => {
  const americasCup2021Ranking = sequelize.define(
    'AmericasCup2021Ranking',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      race_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      boat_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      rank: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      leg: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      dtl: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      secs_to_leader: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      penalty_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      protest_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      status: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      speed: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
    },
    {
      tableName: 'AmericasCup2021Rankings',
      timestamps: false,
    },
  );
  return americasCup2021Ranking;
};

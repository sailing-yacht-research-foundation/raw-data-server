module.exports = (sequelize, Sequelize) => {
  const americasCup2021RoundingTime = sequelize.define(
    'AmericasCup2021RoundingTime',
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
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      boat_original_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      packet_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      mark_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      time: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
    },
    {
      tableName: 'AmericasCup2021RoundingTimes',
      timestamps: false,
    },
  );
  return americasCup2021RoundingTime;
};

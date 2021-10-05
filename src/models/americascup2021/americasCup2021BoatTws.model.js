module.exports = (sequelize, Sequelize) => {
  const americasCup2021BoatTws = sequelize.define(
    'AmericasCup2021BoatTws',
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
      tws_interpolator_value: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      tws_interpolator_time: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
    },
    {
      tableName: 'AmericasCup2021BoatTwss',
      timestamps: false,
    },
  );
  return americasCup2021BoatTws;
};

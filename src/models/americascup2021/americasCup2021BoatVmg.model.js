module.exports = (sequelize, Sequelize) => {
  const americasCup2021BoatVmg = sequelize.define(
    'AmericasCup2021BoatVmg',
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
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      vmg_interpolator_value: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      vmg_interpolator_time: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
    },
    {
      tableName: 'AmericasCup2021BoatVmgs',
      timestamps: false,
    },
  );
  return americasCup2021BoatVmg;
};

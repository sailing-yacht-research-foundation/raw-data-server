module.exports = (sequelize, Sequelize) => {
  const americasCup2021Buoy = sequelize.define(
    'AmericasCup2021Buoy',
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
      mark_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      model: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      first_leg_visible: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      last_leg_visible: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'AmericasCup2021Buoys',
      timestamps: false,
    },
  );
  return americasCup2021Buoy;
};

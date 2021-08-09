module.exports = (sequelize, Sequelize) => {
  const americasCup2021Boat = sequelize.define(
    'AmericasCup2021Boat',
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
      boat_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      team_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      current_leg: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      distance_to_leader: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      rank: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      foil_move_time: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'AmericasCup2021Boats',
      timestamps: false,
    },
  );
  return americasCup2021Boat;
};

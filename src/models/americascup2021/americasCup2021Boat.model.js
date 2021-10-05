module.exports = (sequelize, Sequelize) => {
  const americasCup2021Boat = sequelize.define(
    'AmericasCup2021Boat',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      original_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      race_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      team_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      team_original_id: {
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

module.exports = (sequelize, Sequelize) => {
  const SwiftsureBoat = sequelize.define(
    'SwiftsureBoat',
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
        primaryKey: false,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      boat_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      api_2_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      team_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      division: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      boat_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      yacht_club: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      make: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      loa: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      home_port: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      skipper: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      skipper_email: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      fbib: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      race_sort: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start_time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      num_crew: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      scoring: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'SwiftsureBoats',
      timestamps: false,
    },
  );

  return SwiftsureBoat;
};

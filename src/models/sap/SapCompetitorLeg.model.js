module.exports = (sequelize, Sequelize) => {
  const sapCompetitorLeg = sequelize.define(
    'SapCompetitorLeg',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      race_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      competitor_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      competitor_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      race_name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      regatta: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      from: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      from_waypoint_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      to: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      to_waypoint_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      up_or_downwind_leg: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      average_sog_kts: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      tacks: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      jibes: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      penalty_circle: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      time_since_gun_ms: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      distance_since_gun_m: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      distance_traveled_m: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      distance_traveled_including_gate_start: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      rank: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      gap_to_leader_s: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      gap_to_leader_m: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      started: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      finished: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
    },
    {
      tableName: 'SapCompetitorLegs',
      timestamps: false,
    },
  );
  return sapCompetitorLeg;
};

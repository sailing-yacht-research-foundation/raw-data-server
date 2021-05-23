module.exports = (sequelize, Sequelize) => {
  const georacingSplittimeObject = sequelize.define(
    'GeoracingSplittimeObjects',
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
      actor: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      actor_original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      splittime: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      splittime_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      capital: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      max_speed: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      duration: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      detection_method_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_pit_lap: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      run: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      value_in: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      value_out: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      official: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      hours_mandatory_rest: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      rest_not_in_cp: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      rank: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      rr: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      gap: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      time_out: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'GeoracingSplittimeObjects',
      timestamps: false,
    },
  );

  return georacingSplittimeObject;
};

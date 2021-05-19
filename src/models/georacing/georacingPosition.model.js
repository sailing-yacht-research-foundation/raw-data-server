module.exports = (sequelize, Sequelize) => {
  const georacingPosition = sequelize.define(
    'georacingPositions',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      trackable_type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      trackable_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      trackable_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      race: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      event: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      event_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      timestamp: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      lon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      offset: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      r: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      cl: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      d: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lg: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lt: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      al: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      s: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      h: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      dtnm: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'georacingPositions',
      timestamps: false,
    },
  );

  return georacingPosition;
};

module.exports = (sequelize, Sequelize) => {
  const kattackWaypoint = sequelize.define(
    'KattackWaypoint',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      race: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      original_race_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      html_description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      yacht_club: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      original_yacht_club_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      epoch_offset_sec: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
    },
    {
      tableName: 'KattackWaypoints',
      timestamps: false,
    },
  );

  return kattackWaypoint;
};

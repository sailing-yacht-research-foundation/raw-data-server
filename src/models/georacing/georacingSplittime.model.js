module.exports = (sequelize, Sequelize) => {
  const georacingSplittime = sequelize.define(
    'GeoracingSplittimes',
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
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      short_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      splittimes_visible: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      hide_on_timeline: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lap_number: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      role: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'GeoracingSplittimes',
      timestamps: false,
    },
  );

  return georacingSplittime;
};

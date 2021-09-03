module.exports = (sequelize, Sequelize) => {
  const sapCompetitorBoat = sequelize.define(
    'SapCompetitorBoat',
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
      race_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      race_original_id: {
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
      name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      sail_number: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      color: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      boat_class_name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      boat_class_typically_start_upwind: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      boat_class_hull_length_in_meters: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      boat_class_hull_beam_in_meters: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      boat_class_display_name: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      boat_class_icon_url: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
    },
    {
      tableName: 'SapCompetitorBoats',
      timestamps: false,
    },
  );
  return sapCompetitorBoat;
};

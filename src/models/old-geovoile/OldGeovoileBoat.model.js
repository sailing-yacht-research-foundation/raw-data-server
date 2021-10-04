module.exports = (sequelize, Sequelize) => {
  const oldGeovoileBoat = sequelize.define(
    'OldGeovoileBoat',
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
      class: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      alt: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      q: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      boatOrSponsor: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      arrival: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      durationOrRetired: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'OldGeovoileBoats',
      timestamps: false,
    },
  );
  return oldGeovoileBoat;
};

module.exports = (sequelize, Sequelize) => {
  const oldGeovoilleBoat = sequelize.define(
    'OldGeovoilleBoat',
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
      tableName: 'OldGeovoilleBoats',
      timestamps: false,
    },
  );
  return oldGeovoilleBoat;
};

module.exports = (sequelize, Sequelize) => {
  const kwindooBoat = sequelize.define(
    'KwindooBoat',
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
      regatta: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      regatta_original_id: {
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
      first_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      last_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      email: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      boat_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sail_number: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      race_number: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      handycap: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      helmsman: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      owner_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      homeport: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      registry_number: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      not_racer: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      boat_type_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      boat_type_alias: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      class: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'KwindooBoats',
      timestamps: false,
    },
  );
  return kwindooBoat;
};

module.exports = (sequelize, Sequelize) => {
  const estelaDorsal = sequelize.define(
    'EstelaDorsal',
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
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      model: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      committee: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      number: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      mmsi: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      pivot_club_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      pivot_club_original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      class: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      active: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      track_csv: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'EstelaDorsals',
      timestamps: false,
    },
  );
  return estelaDorsal;
};

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
        primaryKey: false,
      },
      race: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: false,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
        primaryKey: false,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      model: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      committee: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      number: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      mmsi: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      pivot_club_id: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      pivot_club_original_id: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      class: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      active: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
      track_csv: {
        type: Sequelize.TEXT,
        allowNull: true,
        primaryKey: false,
      },
    },
    {
      tableName: 'EstelaDorsals',
      timestamps: false,
    },
  );
  return estelaDorsal;
};

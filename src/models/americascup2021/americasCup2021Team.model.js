module.exports = (sequelize, Sequelize) => {
  const americasCup2021Team = sequelize.define(
    'AmericasCup2021Team',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      race_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      abbreviation: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      flag_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      color: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      boat_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      top_mast_offset_x: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      top_mast_offset_y: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      top_mast_offset_z: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      default_bow_offset: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      jib_target: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      main_sail_target: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      left_foil: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      right_foil: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'AmericasCup2021Teams',
      timestamps: false,
    },
  );
  return americasCup2021Team;
};

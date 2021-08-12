module.exports = (sequelize, Sequelize) => {
  const americasCup2021WindData = sequelize.define(
    'AmericasCup2021WindData',
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
      wind_heading_value: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      wind_heading_time: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      upwind_layline_angle_value: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      upwind_layline_angle_time: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      downwind_layline_angle_value: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      downwind_layline_angle_time: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      wind_speed_value: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      wind_speed_time: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
    },
    {
      tableName: 'AmericasCup2021WindDatas',
      timestamps: false,
    },
  );
  return americasCup2021WindData;
};

module.exports = (sequelize, Sequelize) => {
  const georacingWeather = sequelize.define(
    'georacingWeathers',
    {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      race: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      race_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      wind_direction: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      wind_strength: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      wind_strength_unit: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      temperature: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      temperature_unit: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      time: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'georacingWeathers',
      timestamps: false,
    },
  );

  return georacingWeather;
};

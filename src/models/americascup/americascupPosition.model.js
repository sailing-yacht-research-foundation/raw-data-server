module.exports = (sequelize, Sequelize) => {
  const americasCupPosition = sequelize.define(
    'AmericasCupPosition',
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
      boat_name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      boat: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      boat_original_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      date: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      secs: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      zone: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      lat: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      lon: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      hdg: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      heel: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      pitch: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      cog: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      sog: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      course_wind_direction: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      course_wind_speed: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      y_hdg: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      y_speed: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      y_tws: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      y_twd: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      y_aws: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      y_awa: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      y_twa: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      y_sog: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      y_cog: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      y_rudder: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: 'AmericasCupPositions',
      timestamps: false,
      indexes: [
          {
              fields: ['race'],
          },
      ],
    },
  );
  return americasCupPosition;
};

module.exports = (sequelize, Sequelize) => {
  const tractracEvent = sequelize.define(
    'TracTracEvent',
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
      name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      external_website: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      country: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      city: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      end: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      type: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      web_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sap_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sap_event_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sap_leaderboard_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lat: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lon: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'TracTracEvents',
      timestamps: false,
    },
  );
  return tractracEvent;
};

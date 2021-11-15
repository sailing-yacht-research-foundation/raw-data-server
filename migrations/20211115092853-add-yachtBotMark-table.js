'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    let tableInfo;
    try {
      tableInfo = await queryInterface.describeTable('YachtBotMarks');
    } catch (err) {
      tableInfo = null;
    }

    if (!tableInfo) {
      await queryInterface.createTable('YachtBotMarks', {
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
        colour: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        name: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        type: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        connected_buoy: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        connected_buoy_original_id: {
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
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('YachtBotMarks');
  },
};

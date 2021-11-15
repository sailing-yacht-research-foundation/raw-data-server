'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('YachtBotBuoys');

    if (!tableInfo.original_object_id) {
      await queryInterface.addColumn('YachtBotBuoys', 'original_object_id', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('YachtBotBuoys', 'original_object_id');
  },
};

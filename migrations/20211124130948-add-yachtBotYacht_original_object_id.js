'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('YachtBotYachts');

    if (!tableInfo.original_object_id) {
      await queryInterface.addColumn('YachtBotYachts', 'original_object_id', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('YachtBotYachts', 'original_object_id');
  },
};

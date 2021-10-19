'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addConstraint('TracTracEvents', {
        fields: ['original_id'],
        type: 'unique',
        name: 'TracTracEvents_original_id_key'
      }, { transaction });

      await queryInterface.addConstraint('TackTrackerRegattas', {
        fields: ['original_id'],
        type: 'unique',
        name: 'TackTrackerRegattas_original_id_key'
      }, { transaction });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeConstraint('TracTracEvents', 'TracTracEvents_original_id_key', { transaction });
      await queryInterface.removeConstraint('TackTrackerRegattas', 'TackTrackerRegattas_original_id_key', { transaction });
    });
  }
};

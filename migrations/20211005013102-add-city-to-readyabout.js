'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable(
      'ReadyAboutRaceMetadatas',
    );

    if (!tableInfo.start_city) {
      await queryInterface.addColumn('ReadyAboutRaceMetadatas', 'start_city', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('ReadyAboutRaceMetadatas', 'start_city');
  },
};

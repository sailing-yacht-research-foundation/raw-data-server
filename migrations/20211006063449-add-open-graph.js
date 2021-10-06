'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable(
      'ReadyAboutRaceMetadatas',
    );

    if (!tableInfo.open_graph_image) {
      await queryInterface.addColumn(
        'ReadyAboutRaceMetadatas',
        'open_graph_image',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
      );
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn(
      'ReadyAboutRaceMetadatas',
      'open_graph_image',
    );
  },
};

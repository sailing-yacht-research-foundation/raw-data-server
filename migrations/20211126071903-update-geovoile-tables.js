'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.sequelize.transaction(async (transaction) => {
      let tableInfo;
      try {
        tableInfo = await queryInterface.describeTable('GeovoileMarks');
      } catch (err) {
        tableInfo = null;
      }

      if (!tableInfo) {
        await queryInterface.createTable(
          'GeovoileMarks',
          {
            id: {
              type: Sequelize.UUID,
              defaultValue: Sequelize.UUIDV1,
              allowNull: false,
              primaryKey: true,
            },
            race_id: {
              type: Sequelize.UUID,
              allowNull: false,
            },
            race_original_id: {
              type: Sequelize.UUID,
              allowNull: true,
            },
            name: {
              type: Sequelize.STRING,
              allowNull: true,
            },
            type: {
              type: Sequelize.STRING,
              allowNull: true,
            },
            lon: {
              type: Sequelize.DOUBLE,
              allowNull: true,
            },
            lat: {
              type: Sequelize.DOUBLE,
              allowNull: true,
            },
            xy: {
              type: Sequelize.ARRAY(Sequelize.TEXT),
              allowNull: true,
            },
          },
          { transaction },
        );
      }

      const tableGeovoileBoats = await queryInterface.describeTable(
        'GeovoileBoats',
      );

      if (!tableGeovoileBoats.arrival) {
        await queryInterface.addColumn(
          'GeovoileBoats',
          'arrival',
          {
            type: Sequelize.JSON,
            allowNull: true,
          },
          { transaction },
        );
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      /**
       * Add reverting commands here.
       *
       * Example:
       * await queryInterface.dropTable('users');
       */
      await queryInterface.dropTable('GeovoileMarks', { transaction });
      await queryInterface.removeColumn('GeovoileBoats', 'arrival', {
        transaction,
      });
    });
  },
};
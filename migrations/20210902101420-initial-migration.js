'use strict';

// Other existing scrapers
const failedUrlTables = [
  'EstelaFailedUrls',
  'GeoracingFailedUrls',
  'iSailFailedUrls',
  'KattackFailedUrls',
  'KwindooFailedUrls',
  'MetasailFailedUrls',
  'RaceQsFailedUrls',
  'TackTrackerFailedUrls',
  'TracTracFailedUrls',
  'YachtBotFailedUrls',
  'YellowbrickFailedUrls'
];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // BluewaterFailedUrl
      const bluewaterFailed = await queryInterface.describeTable('BluewaterFailedUrls');
      console.log('q', bluewaterFailed.date_attempted);
      if (bluewaterFailed.date_attempted) {
        console.log(2);
        await queryInterface.renameColumn('BluewaterFailedUrls', 'date_attempted', 'created_at', { transaction });
        await queryInterface.changeColumn('BluewaterFailedUrls', 'created_at', {
          type: 'TIMESTAMP USING CAST("created_at" as TIMESTAMP)',
        }, { transaction });
        await queryInterface.changeColumn('BluewaterFailedUrls', 'created_at', {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('now'),
        }, { transaction });
      }
      if (!bluewaterFailed.error) {
        await queryInterface.addColumn('BluewaterFailedUrls', 'error', { type: Sequelize.TEXT }, { transaction });
      }
      // BluewaterSuccessfulUrls
      const bluewaterSuccess = await queryInterface.describeTable('BluewaterSuccessfulUrls');
      if (bluewaterSuccess.date_attempted) {
        await queryInterface.renameColumn('BluewaterSuccessfulUrls', 'date_attempted', 'created_at', { transaction });
        await queryInterface.changeColumn('BluewaterSuccessfulUrls', 'created_at', {
          type: 'TIMESTAMP USING CAST("created_at" as TIMESTAMP)',
        }, { transaction });
        await queryInterface.changeColumn('BluewaterSuccessfulUrls', 'created_at', {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('now'),
        }, { transaction });
      }
      if (!bluewaterSuccess.original_id) {
        await queryInterface.addColumn('BluewaterSuccessfulUrls', 'original_id', {
          type: Sequelize.TEXT,
          allowNull: false,
          defaultValue: '',
        }, { transaction });
      }

      // FailedUrls table for other scrapers
      for (const tableName of failedUrlTables) {
        const failedTable = await queryInterface.describeTable(tableName);
        if (!failedTable.created_at) {
          await queryInterface.addColumn(tableName, 'created_at', {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('now'),
          }, { transaction });
        }
      }

      // iSailRace
      const iSailRace = await queryInterface.describeTable('iSailRaces');
      if (!iSailRace.track_ids) {
        await queryInterface.addColumn('iSailRaces', 'track_ids', { type: Sequelize.ARRAY(Sequelize.TEXT), allowNull: true }, { transaction });
      }

    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // BluewaterFailedUrl
      await queryInterface.renameColumn('BluewaterFailedUrls', 'created_at', 'date_attempted', { transaction });
      await queryInterface.changeColumn('BluewaterFailedUrls', 'date_attempted', {
        type: Sequelize.TEXT,
        allowNull: true,
      }, { transaction });
      await queryInterface.removeColumn('BluewaterFailedUrls', 'error', { transaction });

      // BluewaterSuccessfulUrls
      await queryInterface.renameColumn('BluewaterSuccessfulUrls', 'created_at', 'date_attempted', { transaction });
      await queryInterface.changeColumn('BluewaterSuccessfulUrls', 'date_attempted', {
        type: Sequelize.TEXT,
        allowNull: true,
      }, { transaction });
      await queryInterface.removeColumn('BluewaterSuccessfulUrls', 'original_id', { transaction });

      // FailedUrls table for other scrapers
      for (const tableName of failedUrlTables) {
        await queryInterface.removeColumn(tableName, 'created_at', { transaction });
      }

      // iSailRace
      await queryInterface.removeColumn('iSailRaces', 'track_ids', { transaction });
    });
  }
};

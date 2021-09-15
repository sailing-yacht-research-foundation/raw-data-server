'use strict';
const db = require('../src/models');
const { v4: uuidv4 } = require('uuid');

const tables = [{
    successTable: 'EstelaSuccessfulUrls',
    sourceTable: 'estelaRace',
  }, {
    successTable: 'GeoracingSuccessfulUrls',
    sourceTable: 'georacingRace',
  }, {
    successTable: 'iSailSuccessfulUrls',
    sourceTable: 'iSailEvent',
  }, {
    successTable: 'KattackSuccessfulUrls',
    sourceTable: 'kattackRace',
  }, {
    successTable: 'KwindooSuccessfulUrls',
    sourceTable: 'kwindooRace',
  }, {
    successTable: 'MetasailSuccessfulUrls',
    sourceTable: 'metasailEvent',
  }, {
    successTable: 'RaceQsSuccessfulUrls',
    sourceTable: 'raceQsEvent',
  }, {
    successTable: 'TackTrackerSuccessfulUrls',
    sourceTable: 'tackTrackerRace',
  }, {
    successTable: 'TracTracSuccessfulUrls',
    sourceTable: 'tractracRace',
  }, {
    successTable: 'YachtBotSuccessfulUrls',
    sourceTable: 'yachtBotRace',
  }, {
    successTable: 'YellowbrickSuccessfulUrls',
    sourceTable: 'yellowbrickRace',
    origField: 'race_code'
  },
];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();
      await queryInterface.sequelize.query(`
        UPDATE "BluewaterSuccessfulUrls" s SET original_id = r.original_id
        FROM "BluewaterRaces" r WHERE s.url = 'https://api.bluewatertracks.com/api/race/' || r.slug
      `, { transaction });

      for (const tableInfo of tables) {
        const origField = tableInfo.origField || 'original_id';
        let existingData = await db[tableInfo.sourceTable].findAll({
          attributes: [origField, 'url'],
          raw: true,
        });
        existingData = existingData.map((i) => {
          return {
            id: uuidv4(),
            original_id: i[origField],
            url: i.url,
            created_at: now,
          };
        });
        await queryInterface.bulkInsert(tableInfo.successTable, existingData, { transaction });
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkUpdate('BluewaterSuccessfulUrls', {
        original_id: '',
      }, {}, { transaction });

      for (const tableInfo of tables) {
        await queryInterface.bulkDelete(tableInfo.successTable, {}, { transaction });
      }
    });
  }
};

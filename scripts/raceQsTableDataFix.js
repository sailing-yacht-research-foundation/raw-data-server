require('dotenv').config();
const db = require('../src/models');
/**
 * This script moves the enumerated RaceQs tables because of a typo on table name which created singular named tables. This will move the data to proper plural named tables
 */

(async () => {
  const tables = ['RaceQsDivision', 'RaceQsParticipant', 'RaceQsPosition', 'RaceQsRegatta', 'RaceQsRoute', 'RaceQsStart', 'RaceQsWaypoint'];
  for (tableName of tables) {
    try {
      records = await db.sequelize.query(
        `
        INSERT INTO "${tableName}s" (SELECT * FROM "${tableName}");
      `);
    } catch (err) {
      console.log(`Failed inserting data from ${tableName}`, err);
    }
  }

  console.log('Finished moving RaceQs tables');
})();

const { v4: uuidv4 } = require('uuid');
const db = require('../../../models');

/**
 * Create race from original id
 * @param {transaction} transaction
 * @param {original id} original_id
 * @returns race
 */
const createRaceForRegadata = async (transaction, original_id) => {
  const id = uuidv4();
  const race = { id, original_id };
  await db.regadataRace.create({ id, original_id }, { transaction });
  return race;
};

module.exports = createRaceForRegadata;

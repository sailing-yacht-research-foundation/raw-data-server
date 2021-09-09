const db = require('../../../models');

/**
 * Check if race is exist in the database or not
 * @param {string} original_id
 * @returns boolean
 */
const isRegadataRaceExist = async (original_id) => {
  const existingRace = await db.regadataRace.findOne({
    where: { original_id },
  });
  return existingRace ? true : false;
};

module.exports = isRegadataRaceExist;

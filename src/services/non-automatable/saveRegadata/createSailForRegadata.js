const { v4: uuidv4 } = require('uuid');
const db = require('../../../models');
const { SAVE_DB_POSITION_CHUNK_COUNT } = require('../../../constants');

/**
 * Create sail data related to race
 * @param {Transaction} transaction
 * @param {Race} race
 * @param {Document[]} sailData
 * @returns Map of sail
 */
const createSailForRegadata = async (transaction, race, sailData = []) => {
  if (!sailData || !race) {
    return;
  }
  const map = new Map();

  let newSails = [];
  for (const sail of sailData) {
    const id = uuidv4();
    const newSail = {
      ...sail,
      id,
      original_id: sail._id.toString(),
      race_id: race.id,
      race_original_id: race.original_id,
    };
    newSails.push(newSail);
    map.set(sail.sail, id);
  }

  while (newSails.length > 0) {
    const splicedArray = newSails.splice(0, SAVE_DB_POSITION_CHUNK_COUNT);
    await db.regadataSail.bulkCreate(splicedArray, {
      ignoreDuplicates: true,
      validate: true,
      transaction,
    });
  }

  return map;
};

module.exports = createSailForRegadata;

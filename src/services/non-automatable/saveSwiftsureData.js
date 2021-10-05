// const { v4: uuidv4 } = require('uuid');

// const { SAVE_DB_POSITION_CHUNK_COUNT } = require('../../constants');
const db = require('../../models');
const { normalizeRace } = require('../normalization/normalizeSwiftsure');

const saveSwiftsureData = async (data) => {
  const transaction = await db.sequelize.transaction();
  let errorMessage = '';
  // let raceUrl = [];
  try {
    // if (data.SwiftsureRace) {
    //   raceUrl = data.SwiftsureRace.map((row) => {
    //     return { url: row.url, original_id: row.original_id };
    //   });
    //   await db.swiftsureRace.bulkCreate(data.SwiftsureRace, {
    //     ignoreDuplicates: true,
    //     validate: true,
    //     transaction,
    //   });
    // }
    // if (data.SwiftsureBoat) {
    //   await db.swiftsureBoat.bulkCreate(data.SwiftsureBoat, {
    //     ignoreDuplicates: true,
    //     validate: true,
    //     transaction,
    //   });
    // }
    // if (data.SwiftsureLine) {
    //   await db.swiftsureLine.bulkCreate(data.SwiftsureLine, {
    //     ignoreDuplicates: true,
    //     validate: true,
    //     transaction,
    //   });
    // }
    // if (data.SwiftsureLink) {
    //   await db.swiftsureLink.bulkCreate(data.SwiftsureLink, {
    //     ignoreDuplicates: true,
    //     validate: true,
    //     transaction,
    //   });
    // }
    // if (data.SwiftsureMark) {
    //   await db.swiftsureMark.bulkCreate(data.SwiftsureMark, {
    //     ignoreDuplicates: true,
    //     validate: true,
    //     transaction,
    //   });
    // }
    // if (data.SwiftsurePoint) {
    //   await db.swiftsurePoint.bulkCreate(data.SwiftsurePoint, {
    //     ignoreDuplicates: true,
    //     validate: true,
    //     transaction,
    //   });
    // }
    // if (data.SwiftsureSponsor) {
    //   await db.swiftsureSponsor.bulkCreate(data.SwiftsureSponsor, {
    //     ignoreDuplicates: true,
    //     validate: true,
    //     transaction,
    //   });
    // }
    // if (data.SwiftsurePosition) {
    //   const positions = data.SwiftsurePosition.slice(); // clone array to avoid mutating the data
    //   while (positions.length > 0) {
    //     const splicedArray = positions.splice(0, SAVE_DB_POSITION_CHUNK_COUNT);
    //     await db.swiftsurePosition.bulkCreate(splicedArray, {
    //       ignoreDuplicates: true,
    //       validate: true,
    //       transaction,
    //     });
    //   }
    // }

    if (data.SwiftsureRace) {
      await normalizeRace(data, transaction);
    }
    await transaction.commit();
  } catch (error) {
    console.log(error);
    await transaction.rollback();
  }

  return errorMessage;
};

module.exports = saveSwiftsureData;

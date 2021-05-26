const db = require('../models');

const Op = db.Sequelize.Op;

const saveYachtBotData = async (data) => {
  if (data.YachtBotRace) {
    const existRaces = await db.yachtBotRace.findAll({
      where: {
        id: { [Op.in]: data.YachtBotRace.map((row) => row.id) },
      },
    });
    const toRemove = existRaces.map((row) => row.id);

    const raceData = data.YachtBotRace.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.yachtBotRace.bulkCreate(raceData);
  }
  if (data.YachtBotYacht) {
    const existYachts = await db.yachtBotYacht.findAll({
      where: {
        id: { [Op.in]: data.YachtBotYacht.map((row) => row.id) },
      },
    });
    const toRemove = existYachts.map((row) => row.id);

    const yachtData = data.YachtBotYacht.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.yachtBotYacht.bulkCreate(yachtData);
  }
  if (data.YachtBotBuoy) {
    const existBuoys = await db.yachtBotBuoy.findAll({
      where: {
        id: { [Op.in]: data.YachtBotBuoy.map((row) => row.id) },
      },
    });
    const toRemove = existBuoys.map((row) => row.id);

    const buoyData = data.YachtBotBuoy.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.yachtBotBuoy.bulkCreate(buoyData);
  }
  if (data.YachtBotPosition) {
    const existPositions = await db.yachtBotPosition.findAll({
      where: {
        id: { [Op.in]: data.YachtBotPosition.map((row) => row.id) },
      },
    });
    const toRemove = existPositions.map((row) => row.id);

    const positionData = data.YachtBotPosition.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.yachtBotPosition.bulkCreate(positionData);
  }

  return true;
};

module.exports = saveYachtBotData;

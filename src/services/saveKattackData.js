const db = require('../models');

const Op = db.Sequelize.Op;

const saveKattackData = async (data) => {
  if (data.KattackYachtClub) {
    const existClubs = await db.kattackYachtClub.findAll({
      where: { id: { [Op.in]: data.KattackYachtClub.map((row) => row.id) } },
    });
    const toRemove = existClubs.map((row) => row.id);

    const clubData = data.KattackYachtClub.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.kattackYachtClub.bulkCreate(clubData);
  }
  if (data.KattackRace) {
    const existRaces = await db.kattackRace.findAll({
      where: { id: { [Op.in]: data.KattackRace.map((row) => row.id) } },
    });
    const toRemove = existRaces.map((row) => row.id);

    const raceData = data.KattackRace.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.kattackRace.bulkCreate(raceData);
  }
  if (data.KattackDevice) {
    const existDevices = await db.kattackDevice.findAll({
      where: { id: { [Op.in]: data.KattackDevice.map((row) => row.id) } },
    });
    const toRemove = existDevices.map((row) => row.id);

    const deviceData = data.KattackDevice.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.kattackDevice.bulkCreate(deviceData);
  }
  if (data.KattackPosition) {
    const existPositions = await db.kattackPosition.findAll({
      where: { id: { [Op.in]: data.KattackPosition.map((row) => row.id) } },
    });
    const toRemove = existPositions.map((row) => row.id);

    const positionData = data.KattackPosition.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.kattackPosition.bulkCreate(positionData);
  }
  if (data.KattackWaypoint) {
    const existWaypoints = await db.kattackWaypoint.findAll({
      where: { id: { [Op.in]: data.KattackWaypoint.map((row) => row.id) } },
    });
    const toRemove = existWaypoints.map((row) => row.id);

    const waypointData = data.KattackWaypoint.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.kattackWaypoint.bulkCreate(waypointData);
  }
  return true;
};

module.exports = saveKattackData;

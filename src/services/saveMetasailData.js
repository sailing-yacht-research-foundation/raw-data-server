const db = require('../models');

const Op = db.Sequelize.Op;

const saveMetasailData = async (data) => {
  if (data.MetasailEvent) {
    const existEvents = await db.metasailEvent.findAll({
      where: {
        id: { [Op.in]: data.MetasailEvent.map((row) => row.id) },
      },
    });
    const toRemove = existEvents.map((row) => row.id);

    const eventData = data.MetasailEvent.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.metasailEvent.bulkCreate(eventData);
  }
  if (data.MetasailRace) {
    const existRaces = await db.metasailRace.findAll({
      where: {
        id: { [Op.in]: data.MetasailRace.map((row) => row.id) },
      },
    });
    const toRemove = existRaces.map((row) => row.id);

    const raceData = data.MetasailRace.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.metasailRace.bulkCreate(raceData);
  }
  if (data.MetasailBoat) {
    const existBoats = await db.metasailBoat.findAll({
      where: {
        id: { [Op.in]: data.MetasailBoat.map((row) => row.id) },
      },
    });
    const toRemove = existBoats.map((row) => row.id);

    const boatData = data.MetasailBoat.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.metasailBoat.bulkCreate(boatData);
  }
  if (data.MetasailBuoy) {
    const existBuoys = await db.metasailBuoy.findAll({
      where: {
        id: { [Op.in]: data.MetasailBuoy.map((row) => row.id) },
      },
    });
    const toRemove = existBuoys.map((row) => row.id);

    const buoyData = data.MetasailBuoy.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.metasailBuoy.bulkCreate(buoyData);
  }
  if (data.MetasailGate) {
    const existGates = await db.metasailGate.findAll({
      where: {
        id: { [Op.in]: data.MetasailGate.map((row) => row.id) },
      },
    });
    const toRemove = existGates.map((row) => row.id);

    const gateData = data.MetasailGate.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.metasailGate.bulkCreate(gateData);
  }
  if (data.MetasailPosition) {
    const existPositions = await db.metasailPosition.findAll({
      where: {
        id: { [Op.in]: data.MetasailPosition.map((row) => row.id) },
      },
    });
    const toRemove = existPositions.map((row) => row.id);

    const positionData = data.MetasailPosition.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.metasailPosition.bulkCreate(positionData);
  }

  return true;
};

module.exports = saveMetasailData;

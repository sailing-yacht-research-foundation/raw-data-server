const db = require('../models');

const Op = db.Sequelize.Op;

const saveTackTrackerData = async (data) => {
  if (data.TackTrackerRace) {
    const existRaces = await db.tackTrackerRace.findAll({
      where: {
        id: { [Op.in]: data.TackTrackerRace.map((row) => row.id) },
      },
    });
    const toRemove = existRaces.map((row) => row.id);

    const raceData = data.TackTrackerRace.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.tackTrackerRace.bulkCreate(raceData);
  }
  if (data.TackTrackerRegatta) {
    const existRegattas = await db.tackTrackerRegatta.findAll({
      where: {
        id: { [Op.in]: data.TackTrackerRegatta.map((row) => row.id) },
      },
    });
    const toRemove = existRegattas.map((row) => row.id);

    const regattaData = data.TackTrackerRegatta.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.tackTrackerRegatta.bulkCreate(regattaData);
  }
  if (data.TackTrackerBoat) {
    const existBoats = await db.tackTrackerBoat.findAll({
      where: {
        id: { [Op.in]: data.TackTrackerBoat.map((row) => row.id) },
      },
    });
    const toRemove = existBoats.map((row) => row.id);

    const boatData = data.TackTrackerBoat.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.tackTrackerBoat.bulkCreate(boatData);
  }
  if (data.TackTrackerDefault) {
    const existDefaults = await db.tackTrackerDefault.findAll({
      where: {
        id: { [Op.in]: data.TackTrackerDefault.map((row) => row.id) },
      },
    });
    const toRemove = existDefaults.map((row) => row.id);

    const defaultData = data.TackTrackerDefault.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.tackTrackerDefault.bulkCreate(defaultData);
  }
  if (data.TackTrackerFinish) {
    const existFinishes = await db.tackTrackerFinish.findAll({
      where: {
        id: { [Op.in]: data.TackTrackerFinish.map((row) => row.id) },
      },
    });
    const toRemove = existFinishes.map((row) => row.id);

    const finishData = data.TackTrackerFinish.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.tackTrackerFinish.bulkCreate(finishData);
  }
  if (data.TackTrackerMark) {
    const existMarks = await db.tackTrackerMark.findAll({
      where: {
        id: { [Op.in]: data.TackTrackerMark.map((row) => row.id) },
      },
    });
    const toRemove = existMarks.map((row) => row.id);

    const markData = data.TackTrackerMark.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.tackTrackerMark.bulkCreate(markData);
  }
  if (data.TackTrackerPosition) {
    const existPositions = await db.tackTrackerPosition.findAll({
      where: {
        id: { [Op.in]: data.TackTrackerPosition.map((row) => row.id) },
      },
    });
    const toRemove = existPositions.map((row) => row.id);

    const positionData = data.TackTrackerPosition.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.tackTrackerPosition.bulkCreate(positionData);
  }
  if (data.TackTrackerStart) {
    const existStarts = await db.tackTrackerStart.findAll({
      where: {
        id: { [Op.in]: data.TackTrackerStart.map((row) => row.id) },
      },
    });
    const toRemove = existStarts.map((row) => row.id);

    const startData = data.TackTrackerStart.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.tackTrackerStart.bulkCreate(startData);
  }

  return true;
};

module.exports = saveTackTrackerData;

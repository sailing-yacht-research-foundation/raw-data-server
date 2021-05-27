const db = require('../models');

const Op = db.Sequelize.Op;

const saveEstelaData = async (data) => {
  if (data.EstelaBuoy) {
    const existBuoys = await db.estelaBuoy.findAll({
      where: {
        id: { [Op.in]: data.EstelaBuoy.map((row) => row.id) },
      },
    });
    const toRemove = existBuoys.map((row) => row.id);

    const buoyData = data.EstelaBuoy.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.estelaBuoy.bulkCreate(buoyData);
  }
  if (data.EstelaClub) {
    const existClubs = await db.estelaClub.findAll({
      where: {
        id: { [Op.in]: data.EstelaClub.map((row) => row.id) },
      },
    });
    const toRemove = existClubs.map((row) => row.id);

    const clubData = data.EstelaClub.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.estelaClub.bulkCreate(clubData);
  }
  if (data.EstelaDorsal) {
    const existDorsals = await db.estelaDorsal.findAll({
      where: {
        id: { [Op.in]: data.EstelaDorsal.map((row) => row.id) },
      },
    });
    const toRemove = existDorsals.map((row) => row.id);

    const dorsalData = data.EstelaDorsal.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.estelaDorsal.bulkCreate(dorsalData);
  }
  if (data.EstelaPlayer) {
    const existPlayers = await db.estelaPlayer.findAll({
      where: {
        id: { [Op.in]: data.EstelaPlayer.map((row) => row.id) },
      },
    });
    const toRemove = existPlayers.map((row) => row.id);

    const playerData = data.EstelaPlayer.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.estelaPlayer.bulkCreate(playerData);
  }
  if (data.EstelaPosition) {
    const existPositions = await db.estelaPosition.findAll({
      where: {
        id: { [Op.in]: data.EstelaPosition.map((row) => row.id) },
      },
    });
    const toRemove = existPositions.map((row) => row.id);

    const positionData = data.EstelaPosition.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.estelaPosition.bulkCreate(positionData);
  }
  if (data.EstelaRace) {
    const existRaces = await db.estelaRace.findAll({
      where: {
        id: { [Op.in]: data.EstelaPosition.map((row) => row.id) },
      },
    });
    const toRemove = existRaces.map((row) => row.id);

    const raceData = data.EstelaPosition.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.estelaRace.bulkCreate(raceData);
  }
  if (data.EstelaResult) {
    const existResults = await db.estelaResult.findAll({
      where: {
        id: { [Op.in]: data.EstelaResult.map((row) => row.id) },
      },
    });
    const toRemove = existResults.map((row) => row.id);

    const resultData = data.EstelaResult.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.estelaResult.bulkCreate(resultData);
  }
  return true;
};

module.exports = saveEstelaData;

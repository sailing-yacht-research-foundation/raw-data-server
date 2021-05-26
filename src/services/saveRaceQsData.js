const db = require('../models');

const Op = db.Sequelize.Op;

const saveRaceQsData = async (data) => {
  if (data.RaceQsRegatta) {
    const existRegattas = await db.raceQsRegatta.findAll({
      where: {
        id: { [Op.in]: data.RaceQsRegatta.map((row) => row.id) },
      },
    });
    const toRemove = existRegattas.map((row) => row.id);

    const regattaData = data.RaceQsRegatta.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.raceQsRegatta.bulkCreate(regattaData);
  }
  if (data.RaceQsEvent) {
    const existEvents = await db.raceQsEvent.findAll({
      where: {
        id: { [Op.in]: data.RaceQsEvent.map((row) => row.id) },
      },
    });
    const toRemove = existEvents.map((row) => row.id);

    const eventData = data.RaceQsEvent.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.raceQsEvent.bulkCreate(eventData);
  }
  if (data.RaceQsPosition) {
    const existPositions = await db.raceQsPosition.findAll({
      where: {
        id: { [Op.in]: data.RaceQsPosition.map((row) => row.id) },
      },
    });
    const toRemove = existPositions.map((row) => row.id);

    const positionData = data.RaceQsPosition.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.raceQsPosition.bulkCreate(positionData);
  }
  if (data.RaceQsDivision) {
    const existDivisions = await db.raceQsDivision.findAll({
      where: {
        id: { [Op.in]: data.RaceQsDivision.map((row) => row.id) },
      },
    });
    const toRemove = existDivisions.map((row) => row.id);

    const divisionData = data.RaceQsDivision.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.raceQsDivision.bulkCreate(divisionData);
  }
  if (data.RaceQsParticipant) {
    const existParticipants = await db.raceQsParticipant.findAll({
      where: {
        id: { [Op.in]: data.RaceQsParticipant.map((row) => row.id) },
      },
    });
    const toRemove = existParticipants.map((row) => row.id);

    const participantData = data.RaceQsParticipant.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.raceQsParticipant.bulkCreate(participantData);
  }
  if (data.RaceQsRoute) {
    const existRoutes = await db.raceQsRoute.findAll({
      where: {
        id: { [Op.in]: data.RaceQsRoute.map((row) => row.id) },
      },
    });
    const toRemove = existRoutes.map((row) => row.id);

    const routeData = data.RaceQsRoute.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.raceQsRoute.bulkCreate(routeData);
  }
  if (data.RaceQsStart) {
    const existStarts = await db.raceQsStart.findAll({
      where: {
        id: { [Op.in]: data.RaceQsStart.map((row) => row.id) },
      },
    });
    const toRemove = existStarts.map((row) => row.id);

    const startData = data.RaceQsStart.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.raceQsStart.bulkCreate(startData);
  }
  if (data.RaceQsWaypoint) {
    const existWaypoints = await db.raceQsWaypoint.findAll({
      where: {
        id: { [Op.in]: data.RaceQsWaypoint.map((row) => row.id) },
      },
    });
    const toRemove = existWaypoints.map((row) => row.id);

    const waypointData = data.RaceQsWaypoint.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.raceQsWaypoint.bulkCreate(waypointData);
  }

  return true;
};

module.exports = saveRaceQsData;

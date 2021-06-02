const db = require('../models');

const Op = db.Sequelize.Op;

const saveKwindooData = async (data) => {
  if (data.KwindooBoat) {
    const existBoats = await db.kwindooBoat.findAll({
      where: {
        id: { [Op.in]: data.KwindooBoat.map((row) => row.id) },
      },
    });
    const toRemove = existBoats.map((row) => row.id);

    const boatData = data.KwindooBoat.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.kwindooBoat.bulkCreate(boatData);
  }
  if (data.KwindooRace) {
    const existRaces = await db.kwindooRace.findAll({
      where: {
        id: { [Op.in]: data.KwindooRace.map((row) => row.id) },
      },
    });
    const toRemove = existRaces.map((row) => row.id);

    const raceData = data.KwindooRace.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.kwindooRace.bulkCreate(raceData);
  }
  if (data.KwindooRegatta) {
    const existRegattas = await db.kwindooRegatta.findAll({
      where: {
        id: { [Op.in]: data.KwindooRegatta.map((row) => row.id) },
      },
    });
    const toRemove = existRegattas.map((row) => row.id);

    const regattaData = data.KwindooRegatta.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.kwindooRegatta.bulkCreate(regattaData);
  }
  if (data.KwindooRegattaOwner) {
    const existOwners = await db.kwindooRegattaOwner.findAll({
      where: {
        id: { [Op.in]: data.KwindooRegattaOwner.map((row) => row.id) },
      },
    });
    const toRemove = existOwners.map((row) => row.id);

    const ownerData = data.KwindooRegattaOwner.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.kwindooRegattaOwner.bulkCreate(ownerData);
  }
  if (data.KwindooComment) {
    const existComments = await db.kwindooComment.findAll({
      where: {
        id: { [Op.in]: data.KwindooComment.map((row) => row.id) },
      },
    });
    const toRemove = existComments.map((row) => row.id);

    const commentData = data.KwindooComment.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.kwindooComment.bulkCreate(commentData);
  }
  if (data.KwindooHomeportLocation) {
    const existHomeportLocations = await db.kwindooHomeportLocation.findAll({
      where: {
        id: { [Op.in]: data.KwindooHomeportLocation.map((row) => row.id) },
      },
    });
    const toRemove = existHomeportLocations.map((row) => row.id);

    const homeportLocationData = data.KwindooHomeportLocation.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.kwindooHomeportLocation.bulkCreate(homeportLocationData);
  }
  if (data.KwindooMarker) {
    const existMarkers = await db.kwindooMarker.findAll({
      where: {
        id: { [Op.in]: data.KwindooMarker.map((row) => row.id) },
      },
    });
    const toRemove = existMarkers.map((row) => row.id);

    const markerData = data.KwindooMarker.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.kwindooMarker.bulkCreate(markerData);
  }
  if (data.KwindooMIA) {
    const existMIAs = await db.kwindooMIA.findAll({
      where: {
        id: { [Op.in]: data.KwindooMIA.map((row) => row.id) },
      },
    });
    const toRemove = existMIAs.map((row) => row.id);

    const miaData = data.KwindooMIA.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.kwindooMIA.bulkCreate(miaData);
  }
  if (data.KwindooPOI) {
    const existPOIs = await db.kwindooPOI.findAll({
      where: {
        id: { [Op.in]: data.KwindooPOI.map((row) => row.id) },
      },
    });
    const toRemove = existPOIs.map((row) => row.id);

    const poiData = data.KwindooPOI.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.kwindooPOI.bulkCreate(poiData);
  }
  if (data.KwindooPosition) {
    const existPositions = await db.kwindooPosition.findAll({
      where: {
        id: { [Op.in]: data.KwindooPosition.map((row) => row.id) },
      },
    });
    const toRemove = existPositions.map((row) => row.id);

    const positionData = data.KwindooPosition.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.kwindooPosition.bulkCreate(positionData);
  }
  if (data.KwindooRunningGroup) {
    const existRunningGroups = await db.kwindooRunningGroup.findAll({
      where: {
        id: { [Op.in]: data.KwindooRunningGroup.map((row) => row.id) },
      },
    });
    const toRemove = existRunningGroups.map((row) => row.id);

    const runningGroupData = data.KwindooRunningGroup.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.kwindooRunningGroup.bulkCreate(runningGroupData);
  }
  if (data.KwindooVideoStream) {
    const existVideoStreams = await db.kwindooVideoStream.findAll({
      where: {
        id: { [Op.in]: data.KwindooVideoStream.map((row) => row.id) },
      },
    });
    const toRemove = existVideoStreams.map((row) => row.id);

    const videoStreamData = data.KwindooVideoStream.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.kwindooVideoStream.bulkCreate(videoStreamData);
  }
  if (data.KwindooWaypoint) {
    const existWaypoints = await db.kwindooWaypoint.findAll({
      where: {
        id: { [Op.in]: data.KwindooWaypoint.map((row) => row.id) },
      },
    });
    const toRemove = existWaypoints.map((row) => row.id);

    const waypointData = data.KwindooWaypoint.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.kwindooWaypoint.bulkCreate(waypointData);
  }

  return true;
};

module.exports = saveKwindooData;

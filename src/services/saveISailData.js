const db = require('../models');

const Op = db.Sequelize.Op;

const saveISailData = async (data) => {
  if (data.iSailClass) {
    const existClasses = await db.iSailClass.findAll({
      where: { id: { [Op.in]: data.iSailClass.map((row) => row.id) } },
    });
    const toRemove = existClasses.map((row) => row.id);

    const classData = data.iSailClass.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.iSailClass.bulkCreate(classData);
  }
  if (data.iSailEvent) {
    // This field contains only a single object
    const existEvent = await db.iSailEvent.findByPk(data.iSailEvent.id);
    if (!existEvent) {
      await db.iSailEvent.create(data.iSailEvent);
    }
  }
  if (data.iSailRace) {
    const existRaces = await db.iSailRace.findAll({
      where: { id: { [Op.in]: data.iSailRace.map((row) => row.id) } },
    });
    const toRemove = existRaces.map((row) => row.id);

    const raceData = data.iSailRace.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.iSailRace.bulkCreate(raceData);
  }
  if (data.iSailEventParticipant) {
    const existParticipants = await db.iSailEventParticipant.findAll({
      where: {
        id: { [Op.in]: data.iSailEventParticipant.map((row) => row.id) },
      },
    });
    const toRemove = existParticipants.map((row) => row.id);

    const participantData = data.iSailEventParticipant.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.iSailEventParticipant.bulkCreate(participantData);
  }
  if (data.iSailEventTracksData) {
    // This field contains only a single object
    const existEventTrack = await db.iSailEventTracksData.findByPk(
      data.iSailEventTracksData.id,
    );
    if (!existEventTrack) {
      await db.iSailEventTracksData.create(data.iSailEventTracksData);
    }
  }
  if (data.iSailTrack) {
    const existTracks = await db.iSailTrack.findAll({
      where: { id: { [Op.in]: data.iSailTrack.map((row) => row.id) } },
    });
    const toRemove = existTracks.map((row) => row.id);

    const trackData = data.iSailTrack.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.iSailTrack.bulkCreate(trackData);
  }
  if (data.iSailPosition) {
    const existPositions = await db.iSailPosition.findAll({
      where: { id: { [Op.in]: data.iSailPosition.map((row) => row.id) } },
    });
    const toRemove = existPositions.map((row) => row.id);

    const positionData = data.iSailPosition.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.iSailPosition.bulkCreate(positionData);
  }
  if (data.iSailMark) {
    const existMarks = await db.iSailMark.findAll({
      where: { id: { [Op.in]: data.iSailMark.map((row) => row.id) } },
    });
    const toRemove = existMarks.map((row) => row.id);

    const markData = data.iSailMark.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.iSailMark.bulkCreate(markData);
  }
  if (data.iSailStartline) {
    const existStartlines = await db.iSailStartline.findAll({
      where: { id: { [Op.in]: data.iSailStartline.map((row) => row.id) } },
    });
    const toRemove = existStartlines.map((row) => row.id);

    const startlineData = data.iSailStartline.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.iSailStartline.bulkCreate(startlineData);
  }
  if (data.iSailCourseMark) {
    const existCM = await db.iSailCourseMark.findAll({
      where: { id: { [Op.in]: data.iSailCourseMark.map((row) => row.id) } },
    });
    const toRemove = existCM.map((row) => row.id);

    const cmData = data.iSailCourseMark.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.iSailCourseMark.bulkCreate(cmData);
  }
  if (data.iSailRounding) {
    const existRoundings = await db.iSailRounding.findAll({
      where: { id: { [Op.in]: data.iSailRounding.map((row) => row.id) } },
    });
    const toRemove = existRoundings.map((row) => row.id);

    const roundingData = data.iSailRounding.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.iSailRounding.bulkCreate(roundingData);
  }
  if (data.iSailResult) {
    const existResults = await db.iSailResult.findAll({
      where: { id: { [Op.in]: data.iSailResult.map((row) => row.id) } },
    });
    const toRemove = existResults.map((row) => row.id);

    const resultData = data.iSailResult.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.iSailResult.bulkCreate(resultData);
  }
  return true;
};

module.exports = saveISailData;

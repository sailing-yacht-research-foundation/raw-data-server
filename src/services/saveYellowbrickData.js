const db = require('../models');

const Op = db.Sequelize.Op;

const saveYellowbrickData = async (data) => {
  if (data.YellowbrickCourseNode) {
    const existCourseNodes = await db.yellowbrickCourseNode.findAll({
      where: {
        id: { [Op.in]: data.YellowbrickCourseNode.map((row) => row.id) },
      },
    });
    const toRemove = existCourseNodes.map((row) => row.id);

    const courseNodeData = data.YellowbrickCourseNode.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.yellowbrickCourseNode.bulkCreate(courseNodeData);
  }
  if (data.YellowbrickLeaderboardTeam) {
    const existLeaderboardTeams = await db.yellowbrickLeaderboardTeam.findAll({
      where: {
        id: { [Op.in]: data.YellowbrickLeaderboardTeam.map((row) => row.id) },
      },
    });
    const toRemove = existLeaderboardTeams.map((row) => row.id);

    const leaderboardTeamData = data.YellowbrickLeaderboardTeam.filter(
      (row) => {
        return !toRemove.includes(row.id);
      },
    );
    await db.yellowbrickLeaderboardTeam.bulkCreate(leaderboardTeamData);
  }
  if (data.YellowbrickPoi) {
    const existPois = await db.yellowbrickPoi.findAll({
      where: { id: { [Op.in]: data.YellowbrickPoi.map((row) => row.id) } },
    });
    const toRemove = existPois.map((row) => row.id);

    const poiData = data.YellowbrickPoi.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.yellowbrickPoi.bulkCreate(poiData);
  }
  if (data.YellowbrickPosition) {
    const existPositions = await db.yellowbrickPosition.findAll({
      where: { id: { [Op.in]: data.YellowbrickPosition.map((row) => row.id) } },
    });
    const toRemove = existPositions.map((row) => row.id);

    const positionData = data.YellowbrickPosition.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.yellowbrickPosition.bulkCreate(positionData);
  }
  if (data.YellowbrickRace) {
    const existRaces = await db.yellowbrickRace.findAll({
      where: { id: { [Op.in]: data.YellowbrickRace.map((row) => row.id) } },
    });
    const toRemove = existRaces.map((row) => row.id);

    const raceData = data.YellowbrickRace.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.yellowbrickRace.bulkCreate(raceData);
  }
  if (data.YellowbrickTag) {
    const existTags = await db.yellowbrickTag.findAll({
      where: { id: { [Op.in]: data.YellowbrickTag.map((row) => row.id) } },
    });
    const toRemove = existTags.map((row) => row.id);

    const tagData = data.YellowbrickTag.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.yellowbrickTag.bulkCreate(tagData);
  }
  if (data.YellowbrickTeam) {
    const existTeams = await db.yellowbrickTeam.findAll({
      where: { id: { [Op.in]: data.YellowbrickTeam.map((row) => row.id) } },
    });
    const toRemove = existTeams.map((row) => row.id);

    const teamData = data.YellowbrickTeam.filter((row) => {
      return !toRemove.includes(row.id);
    });
    await db.yellowbrickTeam.bulkCreate(teamData);
  }
  return true;
};

module.exports = saveYellowbrickData;

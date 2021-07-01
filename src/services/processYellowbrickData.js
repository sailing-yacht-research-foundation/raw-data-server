const fs = require('fs');
const temp = require('temp');

const db = require('../models');
const Op = db.Sequelize.Op;
const { yellowbrickCombined } = require('../schemas/parquets/yellowbrick');
const yyyymmddFormat = require('../utils/yyyymmddFormat');
const uploadFileToS3 = require('./uploadFileToS3');
const writeToParquet = require('./writeToParquet');

const getRaces = async () => {
  const races = await db.yellowbrickRace.findAll({ raw: true });
  return races;
};
const getCourseNodes = async (raceList) => {
  const courseNodes = await db.yellowbrickCourseNode.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  courseNodes.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const getLeaderboardTeams = async (raceList) => {
  const leaderboardTeams = await db.yellowbrickLeaderboardTeam.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  leaderboardTeams.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const getPois = async (raceList) => {
  const pois = await db.yellowbrickPoi.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  pois.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const getPositions = async (raceList) => {
  const positions = await db.yellowbrickPosition.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  positions.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const getTags = async (raceList) => {
  const tags = await db.yellowbrickTag.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  tags.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const getTeams = async (raceList) => {
  const teams = await db.yellowbrickTeam.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  teams.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};

const processYellowbrickData = async (optionalPath) => {
  const currentDate = new Date();
  const currentYear = String(currentDate.getUTCFullYear());
  const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const fullDateFormat = yyyymmddFormat(currentDate);

  let parquetPath = optionalPath;
  if (!optionalPath) {
    parquetPath = (await temp.open('yellowbrick')).path;
  }

  const races = await getRaces();
  if (races.length === 0) {
    return '';
  }
  const raceList = races.map((row) => row.id);

  const tags = await getTags(raceList);
  const teams = await getTeams(raceList);
  const positions = await getPositions(raceList);
  const pois = await getPois(raceList);
  const courseNodes = await getCourseNodes(raceList);
  const leaderboardTeams = await getLeaderboardTeams(raceList);

  const data = races.map((row) => {
    const {
      id: race_id,
      tz,
      tz_offset,
      lapz,
      laps,
      track_width,
      motd,
      associated2,
      associated,
      hashtag,
      start,
      stop,
      race_code,
      title,
      flag_stopped,
      super_lines,
      kml_s3_id,
      text_leaderboard,
      distance,
      url,
      race_handicap,
    } = row;

    return {
      race_id,
      tz,
      tz_offset,
      lapz,
      laps,
      track_width,
      motd,
      associated2,
      associated,
      hashtag,
      start,
      stop,
      race_code,
      title,
      flag_stopped,
      super_lines,
      kml_s3_id,
      text_leaderboard,
      distance,
      url,
      race_handicap,
      tags: tags.get(race_id),
      teams: teams.get(race_id),
      positions: positions.get(race_id),
      pois: pois.get(race_id),
      leaderboardTeams: leaderboardTeams.get(race_id),
      courseNodes: courseNodes.get(race_id),
    };
  });
  await writeToParquet(data, yellowbrickCombined, parquetPath);
  const fileUrl = await uploadFileToS3(
    parquetPath,
    `yellowbrick/year=${currentYear}/month=${currentMonth}/yellowbrick_${fullDateFormat}.parquet`,
  );
  if (!optionalPath) {
    fs.unlink(parquetPath, (err) => {
      if (err) {
        console.log(err);
      }
    });
  }
  return fileUrl;
};

module.exports = {
  getRaces,
  getCourseNodes,
  getLeaderboardTeams,
  getPositions,
  getPois,
  getTags,
  getTeams,
  processYellowbrickData,
};

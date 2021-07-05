const fs = require('fs');
const temp = require('temp');
const parquet = require('parquetjs-lite');

const db = require('../models');
const Op = db.Sequelize.Op;
const {
  yellowbrickCombined,
  yellowbrickPosition,
} = require('../schemas/parquets/yellowbrick');
const yyyymmddFormat = require('../utils/yyyymmddFormat');
const uploadFileToS3 = require('./uploadFileToS3');

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

  let parquetPath = optionalPath
    ? optionalPath.main
    : (await temp.open('yellowbrick')).path;
  let positionPath = optionalPath
    ? optionalPath.position
    : (await temp.open('yellowbrick_pos')).path;

  const races = await getRaces();
  if (races.length === 0) {
    return '';
  }
  const raceList = races.map((row) => row.id);

  const tags = await getTags(raceList);
  const teams = await getTeams(raceList);
  const pois = await getPois(raceList);
  const courseNodes = await getCourseNodes(raceList);
  const leaderboardTeams = await getLeaderboardTeams(raceList);

  const writer = await parquet.ParquetWriter.openFile(
    yellowbrickCombined,
    parquetPath,
    {
      useDataPageV2: false,
    },
  );
  for (let i = 0; i < races.length; i++) {
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
    } = races[i];

    await writer.appendRow({
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
      pois: pois.get(race_id),
      leaderboardTeams: leaderboardTeams.get(race_id),
      courseNodes: courseNodes.get(race_id),
    });
  }
  await writer.close();

  const posWriter = await parquet.ParquetWriter.openFile(
    yellowbrickPosition,
    positionPath,
    {
      useDataPageV2: false,
    },
  );
  for (let i = 0; i < races.length; i++) {
    const { id: race } = races[i];
    const perPage = 50000;
    let page = 1;
    let pageSize = 0;
    do {
      const data = await db.yellowbrickPosition.findAll({
        where: { race },
        raw: true,
        offset: (page - 1) * perPage,
        limit: perPage,
      });
      pageSize = data.length;
      page++;
      while (data.length > 0) {
        await posWriter.appendRow(data.pop());
      }
    } while (pageSize === perPage);
  }
  await posWriter.close();

  const mainUrl = await uploadFileToS3(
    parquetPath,
    `yellowbrick/year=${currentYear}/month=${currentMonth}/yellowbrick_${fullDateFormat}.parquet`,
  );
  const positionUrl = await uploadFileToS3(
    positionPath,
    `yellowbrick/year=${currentYear}/month=${currentMonth}/yellowbrickPosition_${fullDateFormat}.parquet`,
  );

  if (!optionalPath) {
    fs.unlink(parquetPath, (err) => {
      if (err) {
        console.log(err);
      }
    });
    fs.unlink(positionPath, (err) => {
      if (err) {
        console.log(err);
      }
    });
  }
  return {
    mainUrl,
    positionUrl,
  };
};

module.exports = {
  getRaces,
  getCourseNodes,
  getLeaderboardTeams,
  getPois,
  getTags,
  getTeams,
  processYellowbrickData,
};

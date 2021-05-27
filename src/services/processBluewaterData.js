const temp = require('temp').track();

const db = require('../models');
const Op = db.Sequelize.Op;
const { bluewaterCombined } = require('../schemas/parquets/bluewater');
const yyyymmddFormat = require('../utils/yyyymmddFormat');
const uploadFileToS3 = require('./uploadFileToS3');
const writeToParquet = require('./writeToParquet');

const getRaces = async () => {
  const races = await db.bluewaterRace.findAll({ raw: true });
  return races;
};
const getBoats = async (raceList) => {
  const boats = await db.bluewaterBoat.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const mapBoats = new Map();
  const boatList = [];
  boats.forEach((row) => {
    let currentList = mapBoats.get(row.race);
    boatList.push(row.id);
    mapBoats.set(row.race, [...(currentList || []), row]);
  });
  return { boatList, mapBoats };
};
const getBoatHandicaps = async (boatList) => {
  const boatHandicaps = await db.bluewaterBoatHandicap.findAll({
    where: { boat: { [Op.in]: boatList } },
    raw: true,
  });
  const result = new Map();
  boatHandicaps.forEach((row) => {
    let currentList = result.get(row.boat);
    result.set(row.boat, [...(currentList || []), row]);
  });
  return result;
};
const getBoatSocialMedias = async (raceList) => {
  const boatSocialMedias = await db.bluewaterBoatSocialMedia.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  boatSocialMedias.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const getCrews = async (raceList) => {
  const crews = await db.bluewaterCrew.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const mapCrews = new Map();
  const crewList = [];
  crews.forEach((row) => {
    let currentList = mapCrews.get(row.race);
    crewList.push(row.id);
    mapCrews.set(row.race, [...(currentList || []), row]);
  });
  return { crewList, mapCrews };
};
const getCrewSocialMedias = async (crewList) => {
  const crewSocialMedias = await db.bluewaterCrewSocialMedia.findAll({
    where: { crew: { [Op.in]: crewList } },
    raw: true,
  });
  const result = new Map();
  crewSocialMedias.forEach((row) => {
    let currentList = result.get(row.crew);
    result.set(row.crew, [...(currentList || []), row]);
  });
  return result;
};
const getMaps = async (raceList) => {
  const maps = await db.bluewaterMap.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  maps.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const getPositions = async (raceList) => {
  const positions = await db.bluewaterPosition.findAll({
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

const processBluewaterData = async () => {
  const currentDate = new Date();
  const currentYear = String(currentDate.getUTCFullYear());
  const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const fullDateFormat = yyyymmddFormat(currentDate);
  const dirPath = await temp.mkdir('rds-bluewater');

  const parquetPath = `${dirPath}/bluewater.parquet`;
  const races = await getRaces();
  if (races.length === 0) {
    return '';
  }
  const raceList = races.map((row) => row.id);

  const { boatList, mapBoats } = await getBoats(raceList);
  const mapBoatHandicaps = await getBoatHandicaps(boatList);
  const boatSocialMedias = await getBoatSocialMedias(raceList);
  const { crewList, mapCrews } = await getCrews(raceList);
  const mapCrewSocialMedias = await getCrewSocialMedias(crewList);
  const maps = await getMaps(raceList);
  const positions = await getPositions(raceList);

  const data = races.map((row) => {
    const {
      id: race_id,
      original_id: race_original_id,
      name,
      referral_url,
      start_time,
      timezone_location,
      timezone_offset,
      finish_timezone_location,
      finish_timezone_offset,
      track_time_start,
      track_time_finish,
      account_name,
      account_website,
      calculation,
      slug,
    } = row;

    let crews = mapCrews.get(race_id);
    let crewSocialMedias = [];
    crews.forEach((crew) => {
      let socMeds = mapCrewSocialMedias.get(crew.id);
      if (socMeds) {
        crewSocialMedias = [...crewSocialMedias, ...socMeds];
      }
    });
    let boats = mapBoats.get(race_id);
    let boatHandicaps = [];
    boats.forEach((boat) => {
      let handicaps = mapBoatHandicaps.get(boat.id);
      if (handicaps) {
        boatHandicaps = [...boatHandicaps, ...handicaps];
      }
    });

    return {
      race_id,
      race_original_id,
      name,
      referral_url,
      start_time,
      timezone_location,
      timezone_offset,
      finish_timezone_location,
      finish_timezone_offset,
      track_time_start,
      track_time_finish,
      account_name,
      account_website,
      calculation,
      slug,
      boats,
      boatHandicaps,
      boatSocialMedias: boatSocialMedias.get(race_id),
      crews,
      crewSocialMedias,
      markers: maps.get(race_id),
      mias: positions.get(race_id),
    };
  });
  await writeToParquet(data, bluewaterCombined, parquetPath);
  const fileUrl = await uploadFileToS3(
    parquetPath,
    `bluewater/year=${currentYear}/month=${currentMonth}/bluewater_${fullDateFormat}.parquet`,
  );
  temp.cleanup();
  return fileUrl;
};

module.exports = {
  getRaces,
  getBoats,
  getBoatHandicaps,
  getBoatSocialMedias,
  getCrews,
  getCrewSocialMedias,
  getMaps,
  getPositions,
  processBluewaterData,
};
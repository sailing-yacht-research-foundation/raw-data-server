const temp = require('temp').track();

const db = require('../models');
const Op = db.Sequelize.Op;
const yyyymmddFormat = require('../utils/yyyymmddFormat');
const { iSailCombinedToParquet } = require('./iSailToParquet');
const uploadFileToS3 = require('./uploadFileToS3');

const processISailData = async () => {
  const currentDate = new Date();
  const currentYear = String(currentDate.getUTCFullYear());
  const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const fullDateFormat = yyyymmddFormat(currentDate);

  let dirPath = await temp.mkdir('rds-isail');

  //   const racePath = `${dirPath}/iSailRaces.parquet`;
  //   const iSailRaces = await db.iSailRace.findAll({ raw: true });
  //   await iSailRaceToParquet(iSailRaces, racePath);
  //   await uploadFileToS3(
  //     racePath,
  //     `iSail_races/year=${currentYear}/month=${currentMonth}/isail_races_${fullDateFormat}.parquet`,
  //   );

  const combinedPath = `${dirPath}/iSailCombined.parquet`;
  const iSailEvents = await db.iSailEvent.findAll({ raw: true });
  const queryEventList = iSailEvents.map((row) => row.id);
  const iSailEventParticipants = await db.iSailEventParticipant.findAll({
    where: { event: { [Op.in]: queryEventList } },
    raw: true,
  });
  const iSailRaces = await db.iSailRace.findAll({
    where: { event: { [Op.in]: queryEventList } },
    raw: true,
  });
  const eventData = iSailEvents.map((row) => {
    const {
      id,
      original_id,
      name,
      start_date,
      start_timezone_type,
      start_timezone,
      stop_date,
      stop_timezone_type,
      stop_timezone,
      club,
      location,
      url,
    } = row;
    return {
      id,
      original_id,
      name,
      start_date,
      start_timezone_type,
      start_timezone,
      stop_date,
      stop_timezone_type,
      stop_timezone,
      club,
      location,
      url,
      participants: iSailEventParticipants.filter((participant) => {
        return participant.event === row.id;
      }),
      races: iSailRaces.filter((race) => {
        return race.event === row.id;
      }),
    };
  });
  await iSailCombinedToParquet(eventData, combinedPath);
  const fileUrl = await uploadFileToS3(
    combinedPath,
    `iSail/year=${currentYear}/month=${currentMonth}/isail_${fullDateFormat}.parquet`,
  );
  temp.cleanup();
  return fileUrl;
};

module.exports = processISailData;

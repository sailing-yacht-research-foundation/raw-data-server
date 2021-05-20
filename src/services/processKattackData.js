const temp = require('temp').track();

const db = require('../models');
const yyyymmddFormat = require('../utils/yyyymmddFormat');
const writeToParquet = require('./writeToParquet');
const uploadFileToS3 = require('./uploadFileToS3');
const { kattackCombined } = require('../schemas/parquets/kattack');

const processKattackData = async () => {
  const currentDate = new Date();
  const currentYear = String(currentDate.getUTCFullYear());
  const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const fullDateFormat = yyyymmddFormat(currentDate);
  const dirPath = await temp.mkdir('rds-kattack');

  const filePath = `${dirPath}/kattack.parquet`;
  const yachtClubs = await db.kattackYachtClub.findAll({ raw: true });
  const races = await db.kattackRace.findAll({ raw: true });
  const devices = await db.kattackDevice.findAll({ raw: true });
  const positions = await db.kattackPosition.findAll({ raw: true });
  const waypoints = await db.kattackWaypoint.findAll({ raw: true });
  const data = {
    yachtClubs: JSON.stringify(yachtClubs),
    races: JSON.stringify(races),
    devices: JSON.stringify(devices),
    positions: JSON.stringify(positions),
    waypoints: JSON.stringify(waypoints),
  };
  await writeToParquet(data, kattackCombined, filePath);
  const fileUrl = await uploadFileToS3(
    filePath,
    `kattack/year=${currentYear}/month=${currentMonth}/kattack_${fullDateFormat}.parquet`,
  );
  temp.cleanup();
  return fileUrl;
};

module.exports = processKattackData;

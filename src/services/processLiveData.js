const temp = require('temp').track();

const db = require('../models');
const { liveDataSchema } = require('../schemas/parquets/liveData');
const yyyymmddFormat = require('../utils/yyyymmddFormat');
const uploadFileToS3 = require('./uploadFileToS3');
const writeToParquet = require('./writeToParquet');

const getDataPoints = async () => {
  const dataPoints = await db.liveDataPoint.findAll({ raw: true });
  return dataPoints;
};

const processLiveData = async (optionalPath) => {
  const currentDate = new Date();
  const currentYear = String(currentDate.getUTCFullYear());
  const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const fullDateFormat = yyyymmddFormat(currentDate);

  let parquetPath = optionalPath;
  if (!optionalPath) {
    const dirPath = await temp.mkdir('rds-livedata');
    parquetPath = `${dirPath}/livedata.parquet`;
  }

  const dataPoints = await getDataPoints();
  if (dataPoints.length === 0) {
    return '';
  }

  // TODO: Need to add master data (boats, races, etc) here once available
  const distinctRaces = new Map();
  dataPoints.forEach((row) => {
    if (!distinctRaces.has(row.race_unit_id)) {
      // TODO: Replace with actual race data, for now only race_unit_id
      distinctRaces.set(row.race_unit_id, {
        race_unit_id: row.race_unit_id,
        data_points: [],
      });
    }
    let race = distinctRaces.get(row.race_unit_id);
    race.data_points.push({
      id: row.id,
      lat: String(row.location.coordinates[0]),
      lon: String(row.location.coordinates[1]),
      speed: row.speed,
      heading: row.heading,
      accuracy: row.accuracy,
      altitude: row.altitude,
      at: row.at.getTime(),
      tws: row.tws,
      twa: row.twa,
      stw: row.stw,
      boat_participant_group_id: row.boat_participant_group_id,
      boat_id: row.boat_id,
      device_id: row.device_id,
      user_id: row.user_id,
      public_id: row.public_id,
    });
  });

  let data = [];
  for (let [key, value] of distinctRaces) {
    data.push({
      race_unit_id: key,
      data_points: value.data_points,
    });
  }
  await writeToParquet(data, liveDataSchema, parquetPath);
  const fileUrl = await uploadFileToS3(
    parquetPath,
    `livedata/year=${currentYear}/month=${currentMonth}/livedata_${fullDateFormat}.parquet`,
  );
  if (!optionalPath) {
    temp.cleanup();
  }
  return fileUrl;
};

module.exports = {
  getDataPoints,
  processLiveData,
};

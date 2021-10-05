const fs = require('fs');
const temp = require('temp');
const parquet = require('parquetjs-lite');

const db = require('../../models');
const Op = db.Sequelize.Op;
const {
  americasCup2021BoatTwd,
  americasCup2021BoatPosition,
  americasCup2021WindPoint,
  americasCup2021WindData,
  americasCup2021Combined,
  americasCup2021BuoyPositionState,
  americasCup2021BuoyPosition,
  americasCup2021BoundaryPacket,
  americasCup2021BoatTws,
  americasCup2021BoatVmg,
} = require('../../schemas/parquets/americasCup2021');
const yyyymmddFormat = require('../../utils/yyyymmddFormat');
const uploadUtil = require('../uploadUtil');

const getRaces = async () => {
  const races = await db.americasCup2021Race.findAll({ raw: true });
  return races;
};
const getObjectToRaceMapping = async (tableName, raceList) => {
  const result = await db[tableName].findAll({
    where: { race_id: { [Op.in]: raceList } },
    raw: true,
  });
  const mapping = new Map();
  result.forEach((row) => {
    let currentList = mapping.get(row.race_id);
    mapping.set(row.race_id, [...(currentList || []), row]);
  });
  return mapping;
};

const getObjectToBoatMapping = async (tableName, boatList) => {
  const result = await db[tableName].findAll({
    where: { boat_id: { [Op.in]: boatList } },
    raw: true,
  });
  const mapping = new Map();
  result.forEach((row) => {
    let currentList = mapping.get(row.boat_id);
    mapping.set(row.boat_id, [...(currentList || []), row]);
  });
  return mapping;
};

const processAmericasCup2021Data = async (optionalPath) => {
  const currentDate = new Date();
  const currentYear = String(currentDate.getUTCFullYear());
  const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const fullDateFormat = yyyymmddFormat(currentDate);

  let parquetPath = optionalPath
    ? optionalPath.main
    : (await temp.open('americascup2021')).path;
  let positionPath = optionalPath
    ? optionalPath.position
    : (await temp.open('americascup2021_pos')).path;
  let twdPath = optionalPath
    ? optionalPath.twd
    : (await temp.open('americascup2021_twd')).path;
  let twsPath = optionalPath
    ? optionalPath.tws
    : (await temp.open('americascup2021_tws')).path;
  let vmgPath = optionalPath
    ? optionalPath.vmg
    : (await temp.open('americascup2021_vmg')).path;
  let boundaryPacketPath = optionalPath
    ? optionalPath.boundarypacket
    : (await temp.open('americascup2021_boundarypacket')).path;
  let buoyPositionStatePath = optionalPath
    ? optionalPath.buoypositionstate
    : (await temp.open('americascup2021_buoyposition')).path;
  let buoyPositionPath = optionalPath
    ? optionalPath.buoyposition
    : (await temp.open('americascup2021_buoypositionstate')).path;
  let windDataPath = optionalPath
    ? optionalPath.winddata
    : (await temp.open('americascup2021_winddata')).path;
  let windPointPath = optionalPath
    ? optionalPath.windpoint
    : (await temp.open('americascup2021_windpoint')).path;
  const races = await getRaces();
  if (races.length === 0) {
    return '';
  }

  const raceList = races.map((row) => row.id);

  const boatsMap = await getObjectToRaceMapping(
    'americasCup2021Boat',
    raceList,
  );

  let boatList = [];
  boatsMap.forEach((boat) => {
    boatList = boatList.concat(boat.map((x) => x.id));
  });
  const boatLeftFoilPositionMap = await getObjectToBoatMapping(
    'americasCup2021BoatLeftFoilPosition',
    boatList,
  );
  const boatLeftFoilStateMap = await getObjectToBoatMapping(
    'americasCup2021BoatLeftFoilState',
    boatList,
  );
  const boatLegMap = await getObjectToBoatMapping(
    'americasCup2021BoatLeg',
    boatList,
  );
  const boatPenaltyMap = await getObjectToBoatMapping(
    'americasCup2021BoatPenalty',
    boatList,
  );
  const boatProtestMap = await getObjectToBoatMapping(
    'americasCup2021BoatProtest',
    boatList,
  );
  const boatRankMap = await getObjectToBoatMapping(
    'americasCup2021BoatRank',
    boatList,
  );
  const boatRightFoilPositionMap = await getObjectToBoatMapping(
    'americasCup2021BoatRightFoilPosition',
    boatList,
  );
  const boatRightFoilStateMap = await getObjectToBoatMapping(
    'americasCup2021BoatRightFoilState',
    boatList,
  );
  const boatRudderAngleMap = await getObjectToBoatMapping(
    'americasCup2021BoatRudderAngle',
    boatList,
  );
  const boatSowMap = await getObjectToBoatMapping(
    'americasCup2021BoatSow',
    boatList,
  );
  const boatStatusMap = await getObjectToBoatMapping(
    'americasCup2021BoatStatus',
    boatList,
  );
  const buoyMap = await getObjectToRaceMapping('americasCup2021Buoy', raceList);
  const raceStatusMap = await getObjectToRaceMapping(
    'americasCup2021RaceStatus',
    raceList,
  );
  const rankingMap = await getObjectToRaceMapping(
    'americasCup2021Ranking',
    raceList,
  );
  const teamMap = await getObjectToRaceMapping('americasCup2021Team', raceList);

  const roundingTimeMap = await getObjectToRaceMapping(
    'americasCup2021RoundingTime',
    raceList,
  );

  const writer = await parquet.ParquetWriter.openFile(
    americasCup2021Combined,
    parquetPath,
    {
      useDataPageV2: false,
    },
  );
  for (let i = 0; i < races.length; i++) {
    const {
      id: race_id,
      original_id: race_original_id,
      event_name,
      race_name,
      terrain_config_location_lon,
      terrain_config_location_lat,
      boundary_center_set,
      current_leg,
      min_race_time,
      max_race_time,
      last_packet_time,
      packet_id,
      start_time,
      num_legs,
      course_angle,
      race_status,
      boat_type,
      live_delay_secs,
      scene_center_utm_lon,
      scene_center_utm_lat,
      sim_time,
    } = races[i];
    const boats = boatsMap.get(race_id);
    const finalBoats = boats?.map((row) => {
      return Object.assign({}, row, {
        leftFoilPosition: boatLeftFoilPositionMap.get(row.id),
        leftFoilState: boatLeftFoilStateMap.get(row.id),
        rightFoilPosition: boatRightFoilPositionMap.get(row.id),
        rightFoilState: boatRightFoilStateMap.get(row.id),
        penalty: boatPenaltyMap.get(row.id),
        protest: boatProtestMap.get(row.id),
        rank: boatRankMap.get(row.id),
        rudderAngle: boatRudderAngleMap.get(row.id),
        sow: boatSowMap.get(row.id),
        status: boatStatusMap.get(row.id),
        leg: boatLegMap.get(row.id),
      });
    });
    await writer.appendRow({
      id: race_id,
      original_id: race_original_id,
      event_name,
      race_name,
      terrain_config_location_lon,
      terrain_config_location_lat,
      boundary_center_set,
      current_leg,
      min_race_time,
      max_race_time,
      last_packet_time,
      packet_id,
      start_time,
      num_legs,
      course_angle,
      race_status,
      boat_type,
      live_delay_secs,
      scene_center_utm_lon,
      scene_center_utm_lat,
      sim_time,
      boats: finalBoats,
      raceStatus: raceStatusMap.get(race_id),
      rankings: rankingMap.get(race_id),
      roundingTimes: roundingTimeMap.get(race_id),
      teams: teamMap.get(race_id),
      buoys: buoyMap.get(race_id),
    });
  }
  await writer.close();

  await createWriter(
    americasCup2021BoatPosition,
    positionPath,
    'race_id',
    races,
    'americasCup2021BoatPosition',
  );
  await createWriter(
    americasCup2021BoatTwd,
    twdPath,
    'boat_id',
    boatList,
    'americasCup2021BoatTwd',
  );
  await createWriter(
    americasCup2021BoatTws,
    twsPath,
    'boat_id',
    boatList,
    'americasCup2021BoatTws',
  );
  await createWriter(
    americasCup2021BoatVmg,
    vmgPath,
    'boat_id',
    boatList,
    'americasCup2021BoatVmg',
  );
  await createWriter(
    americasCup2021BoundaryPacket,
    boundaryPacketPath,
    'race_id',
    races,
    'americasCup2021BoundaryPacket',
  );

  await createWriter(
    americasCup2021BuoyPosition,
    buoyPositionPath,
    'race_id',
    races,
    'americasCup2021BuoyPosition',
  );

  await createWriter(
    americasCup2021BuoyPositionState,
    buoyPositionStatePath,
    'race_id',
    races,
    'americasCup2021BuoyPositionState',
  );
  await createWriter(
    americasCup2021WindData,
    windDataPath,
    'race_id',
    races,
    'americasCup2021WindData',
  );
  await createWriter(
    americasCup2021WindPoint,
    windPointPath,
    'race_id',
    races,
    'americasCup2021WindPoint',
  );

  const mainUrl = await uploadUtil.uploadFileToS3(
    parquetPath,
    `americasCup2021/year=${currentYear}/month=${currentMonth}/americasCup2021_${fullDateFormat}.parquet`,
  );
  const positionUrl = await uploadUtil.uploadFileToS3(
    positionPath,
    `americasCup2021/year=${currentYear}/month=${currentMonth}/americasCup2021Position_${fullDateFormat}.parquet`,
  );
  const twdUrl = await uploadUtil.uploadFileToS3(
    twdPath,
    `americasCup2021/year=${currentYear}/month=${currentMonth}/americasCup2021Twd_${fullDateFormat}.parquet`,
  );
  const twsUrl = await uploadUtil.uploadFileToS3(
    twsPath,
    `americasCup2021/year=${currentYear}/month=${currentMonth}/americasCup2021Tws_${fullDateFormat}.parquet`,
  );
  const vmgUrl = await uploadUtil.uploadFileToS3(
    vmgPath,
    `americasCup2021/year=${currentYear}/month=${currentMonth}/americasCup2021Vmg_${fullDateFormat}.parquet`,
  );
  const boundaryPacketUrl = await uploadUtil.uploadFileToS3(
    boundaryPacketPath,
    `americasCup2021/year=${currentYear}/month=${currentMonth}/americasCup2021BoundaryPacket_${fullDateFormat}.parquet`,
  );
  const buoyPositionUrl = await uploadUtil.uploadFileToS3(
    buoyPositionPath,
    `americasCup2021/year=${currentYear}/month=${currentMonth}/americasCup2021BuoyPosition_${fullDateFormat}.parquet`,
  );
  const buoyPositionStateUrl = await uploadUtil.uploadFileToS3(
    buoyPositionStatePath,
    `americasCup2021/year=${currentYear}/month=${currentMonth}/americasCup2021BuoyPositionState_${fullDateFormat}.parquet`,
  );
  const windDataUrl = await uploadUtil.uploadFileToS3(
    windDataPath,
    `americasCup2021/year=${currentYear}/month=${currentMonth}/americasCup2021WindData_${fullDateFormat}.parquet`,
  );
  const windPointUrl = await uploadUtil.uploadFileToS3(
    windPointPath,
    `americasCup2021/year=${currentYear}/month=${currentMonth}/americasCup2021WindPoint_${fullDateFormat}.parquet`,
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
    fs.unlink(twdPath, (err) => {
      if (err) {
        console.log(err);
      }
    });
    fs.unlink(twsPath, (err) => {
      if (err) {
        console.log(err);
      }
    });
    fs.unlink(vmgPath, (err) => {
      if (err) {
        console.log(err);
      }
    });
    fs.unlink(boundaryPacketPath, (err) => {
      if (err) {
        console.log(err);
      }
    });
    fs.unlink(buoyPositionPath, (err) => {
      if (err) {
        console.log(err);
      }
    });
    fs.unlink(buoyPositionStatePath, (err) => {
      if (err) {
        console.log(err);
      }
    });
    fs.unlink(windDataPath, (err) => {
      if (err) {
        console.log(err);
      }
    });
    fs.unlink(windPointPath, (err) => {
      if (err) {
        console.log(err);
      }
    });
  }

  // Delete parqueted data from DB
  const where = { id: { [Op.in]: raceList } };
  const whereRace = { race_id: { [Op.in]: raceList } };
  await db.americasCup2021Race.destroy({
    where,
  });
  await db.americasCup2021Boat.destroy({
    where: whereRace,
  });
  await db.americasCup2021BoatPosition.destroy({
    where: whereRace,
  });
  await db.americasCup2021BoatLeftFoilState.destroy({
    where: whereRace,
  });
  await db.americasCup2021BoatLeftFoilPosition.destroy({
    where: whereRace,
  });
  await db.americasCup2021BoatLeg.destroy({
    where: whereRace,
  });
  await db.americasCup2021BoatPenalty.destroy({
    where: whereRace,
  });
  await db.americasCup2021BoatProtest.destroy({
    where: whereRace,
  });
  await db.americasCup2021BoatRank.destroy({
    where: whereRace,
  });
  await db.americasCup2021BoatRightFoilPosition.destroy({
    where: whereRace,
  });
  await db.americasCup2021BoatRightFoilState.destroy({
    where: whereRace,
  });
  await db.americasCup2021BoatRudderAngle.destroy({
    where: whereRace,
  });
  await db.americasCup2021BoatSow.destroy({
    where: whereRace,
  });
  await db.americasCup2021BoatStatus.destroy({
    where: whereRace,
  });
  await db.americasCup2021BoatTwd.destroy({
    where: whereRace,
  });
  await db.americasCup2021BoatTws.destroy({
    where: whereRace,
  });
  await db.americasCup2021BoatVmg.destroy({
    where: whereRace,
  });
  await db.americasCup2021BoundaryPacket.destroy({
    where: whereRace,
  });
  await db.americasCup2021Buoy.destroy({
    where: whereRace,
  });
  await db.americasCup2021BuoyPosition.destroy({
    where: whereRace,
  });
  await db.americasCup2021BuoyPositionState.destroy({
    where: whereRace,
  });
  await db.americasCup2021RaceStatus.destroy({
    where: whereRace,
  });
  await db.americasCup2021Ranking.destroy({
    where: whereRace,
  });
  await db.americasCup2021RoundingTime.destroy({
    where: whereRace,
  });
  await db.americasCup2021Team.destroy({
    where: whereRace,
  });
  await db.americasCup2021WindData.destroy({
    where: whereRace,
  });
  await db.americasCup2021WindPoint.destroy({
    where: whereRace,
  });

  return {
    mainUrl,
    positionUrl,
    twdUrl,
    twsUrl,
    vmgUrl,
    boundaryPacketUrl,
    buoyPositionUrl,
    buoyPositionStateUrl,
    windDataUrl,
    windPointUrl,
  };
};

const createWriter = async (
  parquetSchema,
  parquetPath,
  baseId,
  collection,
  dbName,
) => {
  const writer = await parquet.ParquetWriter.openFile(
    parquetSchema,
    parquetPath,
    {
      useDataPageV2: false,
    },
  );
  for (let i = 0; i < collection.length; i++) {
    const id = collection[i]?.id ? collection[i].id : collection[i];
    const perPage = 50000;
    let page = 1;
    let pageSize = 0;
    do {
      const data = await db[dbName].findAll({
        where: { [baseId]: id },
        raw: true,
        offset: (page - 1) * perPage,
        limit: perPage,
      });
      pageSize = data.length;
      page++;
      while (data.length > 0) {
        await writer.appendRow(data.pop());
      }
    } while (pageSize === perPage);
  }
  await writer.close();
};
module.exports = {
  getRaces,
  getObjectToRaceMapping,
  processAmericasCup2021Data,
};

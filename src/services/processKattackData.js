const fs = require('fs');
const temp = require('temp');
const parquet = require('parquetjs-lite');

const db = require('../models');
const Op = db.Sequelize.Op;
const yyyymmddFormat = require('../utils/yyyymmddFormat');
const uploadUtil = require('./uploadUtil');
const {
  kattackCombined,
  kattackPosition,
} = require('../schemas/parquets/kattack');

const getYachtClubs = async () => {
  const yachtClubs = await db.kattackYachtClub.findAll({ raw: true });
  const result = new Map();
  yachtClubs.forEach((row) => {
    result.set(row.id, row);
  });
  return result;
};
const getRaces = async () => {
  const races = await db.kattackRace.findAll({ raw: true });
  return races;
};
const getDevices = async (raceList) => {
  const devices = await db.kattackDevice.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  devices.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};
const getWaypoints = async (raceList) => {
  const waypoints = await db.kattackWaypoint.findAll({
    where: { race: { [Op.in]: raceList } },
    raw: true,
  });
  const result = new Map();
  waypoints.forEach((row) => {
    let currentList = result.get(row.race);
    result.set(row.race, [...(currentList || []), row]);
  });
  return result;
};

const processKattackData = async (optionalPath) => {
  const currentDate = new Date();
  const currentYear = String(currentDate.getUTCFullYear());
  const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const fullDateFormat = yyyymmddFormat(currentDate);

  let parquetPath = optionalPath
    ? optionalPath.main
    : (await temp.open('kattack')).path;
  let positionPath = optionalPath
    ? optionalPath.position
    : (await temp.open('kattack_pos')).path;

  const yachtClubs = await getYachtClubs();
  const races = await getRaces();
  if (races.length === 0) {
    return '';
  }

  const raceList = races.map((row) => row.id);
  const devices = await getDevices(raceList);
  const waypoints = await getWaypoints(raceList);

  try {
    const writer = await parquet.ParquetWriter.openFile(
      kattackCombined,
      parquetPath,
      {
        useDataPageV2: false,
      },
    );
    for (let i = 0; i < races.length; i++) {
      const {
        id: race_id,
        original_id: original_race_id,
        name,
        original_paradigm,
        yacht_club,
        original_yacht_club_id,
        original_fleet_id,
        original_series_id,
        original_course_id,
        start,
        stop,
        days,
        sleep_hour,
        wake_hour,
        heartbeat_int_sec,
        wait_samp_int_sec,
        active_samp_int_sec,
        active_pts,
        still_pts,
        still_radius_met,
        upload_int_sec,
        modified_time,
        password,
        race_start_time_utc,
        feed_start_time_epoch_offset_sec,
        prestart_length_sec,
        race_start_time_epoch_offset_sec,
        race_finish_time_epoch_offset_sec,
        feed_length_sec,
        race_length_sec,
        is_distance_race,
        is_open_feed,
        speed_filter_kts,
        is_live,
        has_started,
        lon,
        lat,
        course_heading_deg,
        js_race_feed_id,
        js_race_course_id,
        url,
        leaderboard_data,
      } = races[i];
      const yachtClubData = yacht_club ? yachtClubs.get(yacht_club) : null;

      await writer.appendRow({
        race_id,
        original_race_id,
        name,
        original_paradigm,
        yacht_club,
        original_yacht_club_id,
        yacht_club_name: yachtClubData ? yachtClubData.name : '',
        yacht_club_external_url: yachtClubData
          ? yachtClubData.external_url
          : '',
        original_fleet_id,
        original_series_id,
        original_course_id,
        start,
        stop,
        days,
        sleep_hour,
        wake_hour,
        heartbeat_int_sec,
        wait_samp_int_sec,
        active_samp_int_sec,
        active_pts,
        still_pts,
        still_radius_met,
        upload_int_sec,
        modified_time,
        password,
        race_start_time_utc,
        feed_start_time_epoch_offset_sec,
        prestart_length_sec,
        race_start_time_epoch_offset_sec,
        race_finish_time_epoch_offset_sec,
        feed_length_sec,
        race_length_sec,
        is_distance_race,
        is_open_feed,
        speed_filter_kts,
        is_live,
        has_started,
        lon,
        lat,
        course_heading_deg,
        js_race_feed_id,
        js_race_course_id,
        url,
        leaderboard_data,
        devices: devices.get(race_id),
        waypoints: waypoints.get(race_id),
      });
    }
    await writer.close();

    const posWriter = await parquet.ParquetWriter.openFile(
      kattackPosition,
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
        const data = await db.kattackPosition.findAll({
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

    const mainUrl = await uploadUtil.uploadFileToS3(
      parquetPath,
      `kattack/year=${currentYear}/month=${currentMonth}/kattack_${fullDateFormat}.parquet`,
    );
    const positionUrl = await uploadUtil.uploadFileToS3(
      positionPath,
      `kattack/year=${currentYear}/month=${currentMonth}/kattackPosition_${fullDateFormat}.parquet`,
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

    // Delete parqueted data from DB
    await db.kattackWaypoint.destroy({
      where: { race: { [Op.in]: raceList } },
    });
    await db.kattackDevice.destroy({
      where: { race: { [Op.in]: raceList } },
    });
    await db.kattackPosition.destroy({
      where: { race: { [Op.in]: raceList } },
    });
    const clubIDs = [];
    yachtClubs.forEach((row) => {
      clubIDs.push(row.id);
    });
    await db.kattackYachtClub.destroy({
      where: { id: { [Op.in]: clubIDs } },
    });
    await db.kattackRace.destroy({
      where: { id: { [Op.in]: raceList } },
    });

    return {
      mainUrl,
      positionUrl,
    };
  } catch (error) {
    return {
      mainUrl: null,
      positionUrl: null,
    };
  }
};

module.exports = {
  getYachtClubs,
  getRaces,
  getDevices,
  getWaypoints,
  processKattackData,
};

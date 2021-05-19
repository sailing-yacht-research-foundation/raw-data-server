const temp = require('temp').track();

const db = require('../models');
const yyyymmddFormat = require('../utils/yyyymmddFormat');
const kattackToParquet = require('./kattackToParquet');
const uploadFileToS3 = require('./uploadFileToS3');

const processKattackData = async () => {
  const currentDate = new Date();
  const currentYear = String(currentDate.getUTCFullYear());
  const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const fullDateFormat = yyyymmddFormat(currentDate);
  const dirPath = await temp.mkdir('rds-kattack');

  const combinedPath = `${dirPath}/kattackCombined.parquet`;
  const yachtClubs = await db.kattackYachtClub.findAll({ raw: true });
  const races = await db.kattackRace.findAll({ raw: true });
  const devices = await db.kattackDevice.findAll({ raw: true });
  const positions = await db.kattackPosition.findAll({ raw: true });
  const waypoints = await db.kattackWaypoint.findAll({ raw: true });
  const data = {
    yachtClubs: yachtClubs.map((club) => {
      return {
        id: club.id,
        original_id: club.original_id,
        name: club.name,
        external_url: club.external_url,
      };
    }),
    races: races.map((race) => {
      return {
        id: race.id,
        original_id: race.original_id,
        name: race.name,
        original_paradigm: race.original_paradigm,
        yacht_club: race.yacht_club,
        original_yacht_club_id: race.original_yacht_club_id,
        original_fleet_id: race.original_fleet_id,
        original_series_id: race.original_series_id,
        original_course_id: race.original_course_id,
        start: race.start,
        stop: race.stop,
        days: race.days,
        sleep_hour: race.sleep_hour,
        wake_hour: race.wake_hour,
        heartbeat_int_sec: race.heartbeat_int_sec,
        wait_samp_int_sec: race.wait_samp_int_sec,
        active_samp_int_sec: race.active_samp_int_sec,
        active_pts: race.active_pts,
        still_pts: race.still_pts,
        still_radius_met: race.still_radius_met,
        upload_int_sec: race.upload_int_sec,
        modified_time: race.modified_time,
        password: race.password,
        race_start_time_utc: race.race_start_time_utc,
        feed_start_time_epoch_offset_sec: race.feed_start_time_epoch_offset_sec,
        prestart_length_sec: race.prestart_length_sec,
        race_start_time_epoch_offset_sec: race.race_start_time_epoch_offset_sec,
        race_finish_time_epoch_offset_sec:
          race.race_finish_time_epoch_offset_sec,
        feed_length_sec: race.feed_length_sec,
        race_length_sec: race.race_length_sec,
        is_distance_race: race.is_distance_race,
        is_open_feed: race.is_open_feed,
        speed_filter_kts: race.speed_filter_kts,
        is_live: race.is_live,
        has_started: race.has_started,
        lon: race.lon,
        lat: race.lat,
        course_heading_deg: race.course_heading_deg,
        js_race_feed_id: race.js_race_feed_id,
        js_race_course_id: race.js_race_course_id,
        url: race.url,
        leaderboard_data: race.leaderboard_data,
      };
    }),
    devices: devices.map((device) => {
      return {
        id: device.id,
        original_id: device.original_id,
        race: device.race,
        original_race_id: device.original_race_id,
        name: device.name,
        type: device.type,
        lon: device.lon,
        lat: device.lat,
        last_course_pt_lon: device.last_course_pt_lon,
        last_course_pt_lat: device.last_course_pt_lat,
        speed_kts: device.speed_kts,
        heading_deg: device.heading_deg,
        mode: device.mode,
        status: device.status,
        is_logging: device.is_logging,
        is_blocked: device.is_blocked,
        device_device_id: device.device_device_id,
        yacht_club: device.yacht_club,
        original_yacht_club_id: device.original_yacht_club_id,
        shared_device_device_id: device.shared_device_device_id,
        status_msg: device.status_msg,
        device_internal_name: device.device_internal_name,
        epoch_offset_sec: device.epoch_offset_sec,
        elapsed_time_dhms: device.elapsed_time_dhms,
        info_html: device.info_html,
        info_html_2: device.info_html_2,
        js_data_id: device.js_data_id,
      };
    }),
    positions: positions.map((pos) => {
      return {
        id: pos.id,
        device: pos.device,
        original_device_id: pos.original_device_id,
        race: pos.race,
        original_race_id: pos.original_race_id,
        lon: pos.lon,
        lat: pos.lat,
        time: pos.time,
        speed_kts: pos.speed_kts,
        distance_nm: pos.distance_nm,
        heading_deg: pos.heading_deg,
        epoch_offset_sec: pos.epoch_offset_sec,
      };
    }),
    waypoints: waypoints.map((waypoint) => {
      return {
        id: waypoint.id,
        original_id: waypoint.original_id,
        race: waypoint.race,
        original_race_id: waypoint.original_race_id,
        html_description: waypoint.html_description,
        name: waypoint.name,
        yacht_club: waypoint.yacht_club,
        original_yacht_club_id: waypoint.original_yacht_club_id,
        lon: waypoint.lon,
        lat: waypoint.lat,
        epoch_offset_sec: waypoint.epoch_offset_sec,
      };
    }),
  };
  await kattackToParquet(data, combinedPath);
  const fileUrl = await uploadFileToS3(
    combinedPath,
    `kattack/year=${currentYear}/month=${currentMonth}/kattack_${fullDateFormat}.parquet`,
  );
  temp.cleanup();
  return fileUrl;
};

module.exports = processKattackData;

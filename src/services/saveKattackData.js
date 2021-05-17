const db = require('../models');

const Op = db.Sequelize.Op;

const saveKattackData = async (data) => {
  if (data.kattackYachtClub) {
    const existClubs = await db.kattackYachtClub.findAll({
      where: { id: { [Op.in]: data.kattackYachtClub.map((row) => row.id) } },
    });
    const toRemove = existClubs.map((row) => row.id);

    const clubData = data.kattackYachtClub
      .filter((row) => {
        return !toRemove.includes(row.id);
      })
      .map((row) => {
        return {
          id: row.id,
          original_id: row.original_id,
          name: row.name,
          external_url: row.external_url,
        };
      });
    await db.kattackYachtClub.bulkCreate(clubData);
  }
  if (data.kattackRace) {
    const existRaces = await db.kattackRace.findAll({
      where: { id: { [Op.in]: data.kattackRace.map((row) => row.id) } },
    });
    const toRemove = existRaces.map((row) => row.id);

    const raceData = data.kattackRace
      .filter((row) => {
        return !toRemove.includes(row.id);
      })
      .map((row) => {
        return {
          id: row.id,
          original_id: row.original_id,
          name: row.name,
          original_paradigm: row.original_paradigm,
          yacht_club: row.yacht_club,
          original_yacht_club_id: row.original_yacht_club_id,
          original_fleet_id: row.original_fleet_id,
          original_series_id: row.original_series_id,
          original_course_id: row.original_course_id,
          start: row.start,
          stop: row.stop,
          days: row.days,
          sleep_hour: row.sleep_hour,
          wake_hour: row.wake_hour,
          heartbeat_int_sec: row.heartbeat_int_sec,
          wait_samp_int_sec: row.wait_samp_int_sec,
          active_samp_int_sec: row.active_samp_int_sec,
          active_pts: row.active_pts,
          still_pts: row.still_pts,
          still_radius_met: row.still_radius_met,
          upload_int_sec: row.upload_int_sec,
          modified_time: row.modified_time,
          password: row.password,
          race_start_time_utc: row.race_start_time_utc,
          feed_start_time_epoch_offset_sec:
            row.feed_start_time_epoch_offset_sec,
          prestart_length_sec: row.prestart_length_sec,
          race_start_time_epoch_offset_sec:
            row.race_start_time_epoch_offset_sec,
          race_finish_time_epoch_offset_sec:
            row.race_finish_time_epoch_offset_sec,
          feed_length_sec: row.feed_length_sec,
          race_length_sec: row.race_length_sec,
          is_distance_race: row.is_distance_race,
          is_open_feed: row.is_open_feed,
          speed_filter_kts: row.speed_filter_kts,
          is_live: row.is_live,
          has_started: row.has_started,
          lon: row.lon,
          lat: row.lat,
          course_heading_deg: row.course_heading_deg,
          js_race_feed_id: row.js_race_feed_id,
          js_race_course_id: row.js_race_course_id,
          url: row.url,
          leaderboard_data: row.leaderboard_data,
        };
      });
    await db.kattackRace.bulkCreate(raceData);
  }
  if (data.kattackDevice) {
    const existDevices = await db.kattackDevice.findAll({
      where: { id: { [Op.in]: data.kattackDevice.map((row) => row.id) } },
    });
    const toRemove = existDevices.map((row) => row.id);

    const deviceData = data.kattackDevice
      .filter((row) => {
        return !toRemove.includes(row.id);
      })
      .map((row) => {
        return {
          id: row.id,
          original_id: row.original_id,
          race: row.race,
          original_race_id: row.original_race_id,
          name: row.name,
          type: row.type,
          lon: row.lon,
          lat: row.lat,
          last_course_pt_lon: row.last_course_pt_lon,
          last_course_pt_lat: row.last_course_pt_lat,
          speed_kts: row.speed_kts,
          heading_deg: row.heading_deg,
          mode: row.mode,
          status: row.status,
          is_logging: row.is_logging,
          is_blocked: row.is_blocked,
          device_row_id: row.device_row_id,
          yacht_club: row.yacht_club,
          original_yacht_club_id: row.original_yacht_club_id,
          shared_device_row_id: row.shared_device_row_id,
          status_msg: row.status_msg,
          device_internal_name: row.device_internal_name,
          epoch_offset_sec: row.epoch_offset_sec,
          elapsed_time_dhms: row.elapsed_time_dhms,
          info_html: row.info_html,
          info_html_2: row.info_html_2,
          js_data_id: row.js_data_id,
        };
      });
    await db.kattackDevice.bulkCreate(deviceData);
  }
  if (data.kattackPosition) {
    const existPositions = await db.kattackPosition.findAll({
      where: { id: { [Op.in]: data.kattackPosition.map((row) => row.id) } },
    });
    const toRemove = existPositions.map((row) => row.id);

    const positionData = data.kattackPosition
      .filter((row) => {
        return !toRemove.includes(row.id);
      })
      .map((row) => {
        return {
          id: row.id,
          device: row.device,
          original_device_id: row.original_device_id,
          race: row.race,
          original_race_id: row.original_race_id,
          lon: row.lon,
          lat: row.lat,
          time: row.time,
          speed_kts: row.speed_kts,
          distance_nm: row.distance_nm,
          heading_deg: row.heading_deg,
          epoch_offset_sec: row.epoch_offset_sec,
        };
      });
    await db.kattackPosition.bulkCreate(positionData);
  }
  if (data.kattackWaypoint) {
    const existWaypoints = await db.kattackWaypoint.findAll({
      where: { id: { [Op.in]: data.kattackWaypoint.map((row) => row.id) } },
    });
    const toRemove = existWaypoints.map((row) => row.id);

    const waypointData = data.kattackWaypoint
      .filter((row) => {
        return !toRemove.includes(row.id);
      })
      .map((row) => {
        return {
          id: row.id,
          original_id: row.original_id,
          race: row.race,
          original_race_id: row.original_race_id,
          html_description: row.html_description,
          name: row.name,
          yacht_club: row.yacht_club,
          original_yacht_club_id: row.original_yacht_club_id,
          lon: row.lon,
          lat: row.lat,
          epoch_offset_sec: row.epoch_offset_sec,
        };
      });
    await db.kattackWaypoint.bulkCreate(waypointData);
  }
  return true;
};

module.exports = saveKattackData;

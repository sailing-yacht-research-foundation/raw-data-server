const { v4: uuidv4, v4 } = require('uuid');

const { SAVE_DB_POSITION_CHUNK_COUNT } = require('../../constants');
const db = require('../../models');
const databaseErrorHandler = require('../../utils/databaseErrorHandler');

const saveAmericasCup2021Data = async (data) => {
  const transaction = await db.sequelize.transaction();
  let errorMessage = '';
  try {
    await db.americasCup2021Race.create({
      id: uuidv4(),
      race_id: data.race.raceId,
      terrain_config_location_lon: data.appConfig.terrainConfig.location.x,
      terrain_config_location_lat: data.appConfig.terrainConfig.location.y,
      boundary_center_set: data.race.boundaryCenterSet,
      current_leg: data.race.currentLeg,
      min_race_time: data.race.minRaceTime,
      max_race_time: data.race.maxRaceTime,
      last_packet_time: data.race.lastPacketTime,
      packet_id: data.race.courseInfo.packetId,
      start_time: data.race.courseInfo.startTime,
      num_legs: data.race.courseInfo.numLegs,
      course_angle: data.race.courseInfo.courseAngle,
      race_status: data.race.courseInfo.raceStatus,
      boat_type: data.race.courseInfo.boatType,
      live_delay_secs: data.race.courseInfo.liveDelaySecs,
      scene_center_utm_lon: data.race.sceneCenterUTM.x,
      scene_center_utm_lat: data.race.sceneCenterUTM.y,
      sim_time: data.race.simTime,
    });

    let boatKeys = Object.keys(data.race.boats);
    let boats = boatKeys.map((key) => {
      return {
        id: uuidv4(),
        race_id: data.race.raceId,
        boat_id: data.race.boats[key].boatId,
        team_id: data.race.boats[key].teamId,
        current_leg: data.race.boats[key].current_leg,
        distance_to_leader: data.race.boats[key].distance_to_leader,
        rank: data.race.boats[key].rank,
        foil_move_time: data.race.boats[key].foilMoveTime,
      };
    });
    await db.americasCup2021Boat.bulkCreate(boats, {
      ignoreDuplicates: true,
      validate: true,
      transaction,
    });

    let buoyKeys = Object.keys(data.race.buoys);
    let buoys = buoyKeys.map((key) => {
      return {
        id: uuidv4(),
        race_id: data.race.raceId,
        mark_id: data.race.buoys[key].markId,
        model: data.race.buoys[key].model,
        first_leg_visible: data.race.buoys[key].firstLegVisible,
        last_leg_visible: data.race.buoys[key].lastLegVisible,
      };
    });
    await db.americasCup2021Buoy.bulkCreate(buoys, {
      ignoreDuplicates: true,
      validate: true,
      transaction,
    });

    let teams = data.appConfig.teams.map((row) => {
      return {
        id: uuidv4(),
        team_id: row.team_id,
        race_id: data.race.raceId,
        name: row.name,
        abbreviation: row.abbr,
        flag_id: row.flag_id,
        color: row.color,
        boat_name: row?.boatmodel?.name,
        top_mast_offset_x: row?.boatmodel?.topMastOffset.x,
        top_mast_offset_y: row?.boatmodel?.topMastOffset.y,
        top_mast_offset_z: row?.boatmodel?.topMastOffset.z,
        default_bow_offset: row?.boatmodel?.defaultbowoffset,
        jib_target: row?.boatmodel?.jibtarget,
        main_sail_target: row?.boatmodel?.main_sail_target,
        left_foil: row?.boatmodel?.left_foil,
        right_foil: row?.boatmodel?.right_foil,
      };
    });

    await db.americasCup2021Team.bulkCreate(teams, {
      ignoreDuplicates: true,
      validate: true,
      transaction,
    });

    let rankings = data.race.rankings.map((row) => {
      return {
        id: uuidv4(),
        race_id: data.race.raceId,
        boat_id: row.boat_id,
        rank: row.rank,
        leg: row.leg,
        dtl: row.dtl,
        secs_to_leader: row.secsToLeader,
        penalty_count: row.penaltyCount,
        protest_active: row.protestActive,
        status: row.status,
        speed: row.speed,
      };
    });

    await db.americasCup2021Ranking.bulkCreate(rankings, {
      ignoreDuplicates: true,
      validate: true,
      transaction,
    });

    let roundingTimes = [];
    let roundingTimesKeys = Object.keys(data.race.roundingTimesByMarkId);
    roundingTimesKeys.map((rkey) => {
      let keys = Object.keys(data.race.roundingTimesByMarkId[rkey]);
      for (key of keys) {
        let roundingTime = {
          id: uuidv4(),
          race_id: data.race.raceId,
          boat_id: data.race.roundingTimesByMarkId[rkey][key].boatId,
          packet_id: data.race.roundingTimesByMarkId[rkey][key].packetId,
          mark_number: data.race.roundingTimesByMarkId[rkey][key].markNumber,
          time: data.race.roundingTimesByMarkId[rkey][key].time,
        };
        roundingTimes.push(roundingTime);
      }
    });

    await db.americasCup2021RoundingTime.bulkCreate(roundingTimes, {
      ignoreDuplicates: true,
      validate: true,
      transaction,
    });

    await transaction.commit();
  } catch (error) {
    console.log(error.toString());
    await transaction.rollback();
    errorMessage = databaseErrorHandler(error);
  }
};

module.exports = saveAmericasCup2021Data;

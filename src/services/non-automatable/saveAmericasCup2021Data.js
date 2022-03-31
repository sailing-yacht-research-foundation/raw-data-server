const { v4: uuidv4 } = require('uuid');
const s3Util = require('../s3Util');
const {
  normalizeRace,
} = require('../normalization/non-automatable/normalizeAmericascup2021');
const { SOURCE } = require('../../constants');
const { getExistingData } = require('../scrapedDataResult');

const saveAmericasCup2021Data = async (data) => {
  try {
    let race = {};
    let boatPositions = [];
    let boats = [];
    let teams = [];
    let boatTwds = [];
    let boatTwss = [];
    let boatVmgs = [];
    let buoys = [];
    let buoyPositions = [];
    let roundingTimes = [];
    let boatRanks = [];
    if (data.race) {
      let raceId = uuidv4();
      race = {
        id: raceId,
        original_id: data.race.raceId,
        event_name: data.eventName,
        race_name: data.raceName,
        terrain_config_location_lon: data.appConfig.terrainConfig.location.x,
        terrain_config_location_lat: data.appConfig.terrainConfig.location.y,
        boundary_center_set: data.race.boundaryCenterSet,
        current_leg: data.race.currentLeg,
        min_race_time: data.race.minRaceTime,
        max_race_time: data.race.maxRaceTime,
        last_packet_time: data.race.lastPacketTime,
        packet_id: data.race.courseInfo.packetId,
        start_time: data.race.courseInfo.startTime,
        race_start_time: data.race.raceStartTime,
        num_legs: data.race.courseInfo.numLegs,
        course_angle: data.race.courseInfo.courseAngle,
        race_status: data.race.courseInfo.raceStatus,
        boat_type: data.race.courseInfo.boatType,
        live_delay_secs: data.race.courseInfo.liveDelaySecs,
        scene_center_utm_lon: data.race.sceneCenterUTM.x,
        scene_center_utm_lat: data.race.sceneCenterUTM.y,
        sim_time: data.race.simTime,
      };

      teams = data.appConfig.teams.map((row) => {
        return {
          id: uuidv4(),
          original_id: row.team_id,
          race_id: raceId,
          race_original_id: data.race.raceId,
          name: row.name,
          abbreviation: row.abbr,
          flag_id: row.flag_id,
          color: row.color,
          boat_name: row.boatmodel?.name,
          top_mast_offset_x: row.boatmodel?.topMastOffset.x,
          top_mast_offset_y: row.boatmodel?.topMastOffset.y,
          top_mast_offset_z: row.boatmodel?.topMastOffset.z,
          default_bow_offset: row.boatmodel?.defaultbowoffset,
          jib_target: row.boatmodel?.jibtarget,
          main_sail_target: row.boatmodel?.mainsailtarget,
          left_foil: row.boatmodel?.leftfoil,
          right_foil: row.boatmodel?.rightfoil,
        };
      });

      let boatKeys = Object.keys(data.race.boats);
      boats = boatKeys.map((key) => {
        return {
          id: uuidv4(),
          race_id: raceId,
          race_original_id: data.race.raceId,
          original_id: data.race.boats[key].boatId,
          team_id: teams.find(
            (x) => x.original_id === data.race.boats[key].teamId,
          ).id,
          team_original_id: data.race.boats[key].teamId,
          current_leg: data.race.boats[key].current_leg,
          distance_to_leader: data.race.boats[key].distance_to_leader,
          rank: data.race.boats[key].rank,
          foil_move_time: data.race.boats[key].foilMoveTime,
        };
      });

      boatKeys.map((bKey) => {
        for (const boatIndex in data.race.boats[bKey].headingIntep.valHistory) {
          let boatPosition = {
            id: uuidv4(),
            race_id: raceId,
            race_original_id: data.race.raceId,
            boat_id: boats.find(
              (x) => x.original_id === data.race.boats[bKey].boatId,
            ).id,
            boat_original_id: data.race.boats[bKey].boatId,
            coordinate_interpolator_lon:
              data.race.boats[bKey].coordIntep.yCerp.valHistory[boatIndex][0],
            coordinate_interpolator_lon_time:
              data.race.boats[bKey].coordIntep.yCerp.valHistory[boatIndex][1],
            coordinate_interpolator_lat:
              data.race.boats[bKey].coordIntep.xCerp.valHistory[boatIndex][0],
            coordinate_interpolator_lat_time:
              data.race.boats[bKey].coordIntep.xCerp.valHistory[boatIndex][1],
            heading_interpolator_value:
              data.race.boats[bKey].headingIntep.valHistory[boatIndex][0],
            heading_interpolator_time:
              data.race.boats[bKey].headingIntep.valHistory[boatIndex][1],
            heel_interpolator_value:
              data.race.boats[bKey].heelInterp.valHistory[boatIndex][0],
            heel_interpolator_time:
              data.race.boats[bKey].heelInterp.valHistory[boatIndex][1],
            pitch_interpolator_value:
              data.race.boats[bKey].pitchInterp.valHistory[boatIndex][0],
            pitch_interpolator_time:
              data.race.boats[bKey].pitchInterp.valHistory[boatIndex][1],
            dtl_interpolator_value:
              data.race.boats[bKey].dtlInterp.valHistory[boatIndex][0],
            dtl_interpolator_time:
              data.race.boats[bKey].dtlInterp.valHistory[boatIndex][1],
            speed_interpolator_value:
              data.race.boats[bKey].speedInterp.valHistory[boatIndex][0],
            speed_interpolator_time:
              data.race.boats[bKey].speedInterp.valHistory[boatIndex][1],
            elev_interpolator_value:
              data.race.boats[bKey].elevInterp.valHistory[boatIndex][0],
            elev_interpolator_time:
              data.race.boats[bKey].elevInterp.valHistory[boatIndex][1],
            leg_progress_interpolator_value:
              data.race.boats[bKey].legProgressInterp.valHistory[boatIndex][0],
            leg_progress_interpolator_time:
              data.race.boats[bKey].legProgressInterp.valHistory[boatIndex][1],
          };
          boatPositions.push(boatPosition);
        }
      });

      boatKeys.map((bKey) => {
        for (const boatIndex in data.race.boats[bKey].rankInterp.valHistory) {
          let boatRank = {
            id: uuidv4(),
            race_id: raceId,
            race_original_id: data.race.raceId,
            boat_id: boats.find(
              (x) => x.original_id === data.race.boats[bKey].boatId,
            ).id,
            boat_original_id: data.race.boats[bKey].boatId,
            rank_interpolator_value:
              data.race.boats[bKey].rankInterp.valHistory[boatIndex][0],
            rank_interpolator_time:
              data.race.boats[bKey].rankInterp.valHistory[boatIndex][1],
          };
          boatRanks.push(boatRank);
        }
      });

      boatKeys.map((bKey) => {
        for (const boatIndex in data.race.boats[bKey].twdInterp.valHistory) {
          let boatTwd = {
            id: uuidv4(),
            race_id: raceId,
            race_original_id: data.race.raceId,
            boat_id: boats.find(
              (x) => x.original_id === data.race.boats[bKey].boatId,
            ).id,
            boat_original_id: data.race.boats[bKey].boatId,
            twd_interpolator_value:
              data.race.boats[bKey].twdInterp.valHistory[boatIndex][0],
            twd_interpolator_time:
              data.race.boats[bKey].twdInterp.valHistory[boatIndex][1],
          };
          boatTwds.push(boatTwd);
        }
      });

      boatKeys.map((bKey) => {
        for (const boatIndex in data.race.boats[bKey].twsInterp.valHistory) {
          let boatTws = {
            id: uuidv4(),
            race_id: raceId,
            race_original_id: data.race.raceId,
            boat_id: boats.find(
              (x) => x.original_id === data.race.boats[bKey].boatId,
            ).id,
            boat_original_id: data.race.boats[bKey].boatId,
            tws_interpolator_value:
              data.race.boats[bKey].twsInterp.valHistory[boatIndex][0],
            tws_interpolator_time:
              data.race.boats[bKey].twsInterp.valHistory[boatIndex][1],
          };
          boatTwss.push(boatTws);
        }
      });

      boatKeys.map((bKey) => {
        for (const boatIndex in data.race.boats[bKey].vmgInterp.valHistory) {
          let boatVmg = {
            id: uuidv4(),
            race_id: raceId,
            race_original_id: data.race.raceId,
            boat_id: boats.find(
              (x) => x.original_id === data.race.boats[bKey].boatId,
            ).id,
            boat_original_id: data.race.boats[bKey].boatId,
            vmg_interpolator_value:
              data.race.boats[bKey].vmgInterp.valHistory[boatIndex][0],
            vmg_interpolator_time:
              data.race.boats[bKey].vmgInterp.valHistory[boatIndex][1],
          };
          boatVmgs.push(boatVmg);
        }
      });

      let buoyKeys = Object.keys(data.race.buoys);
      buoys = buoyKeys.map((key) => {
        return {
          id: uuidv4(),
          race_id: raceId,
          race_original_id: data.race.raceId,
          original_id: data.race.buoys[key].markId,
          model: data.race.buoys[key].model,
          first_leg_visible: data.race.buoys[key].firstLegVisible,
          last_leg_visible: data.race.buoys[key].lastLegVisible,
        };
      });

      buoyKeys.map((key) => {
        for (const buoyIndex in data.race.buoys[key].headingInterp.valHistory) {
          let buoyPosition = {
            id: uuidv4(),
            race_id: raceId,
            race_original_id: data.race.raceId,
            mark_id: data.race.buoys[key].markId,
            coordinate_interpolator_lon:
              data.race.buoys[key].coordIntepolator.yCerp.valHistory[
                buoyIndex
              ][0],
            coordinate_interpolator_lon_time:
              data.race.buoys[key].coordIntepolator.yCerp.valHistory[
                buoyIndex
              ][1],
            coordinate_interpolator_lat:
              data.race.buoys[key].coordIntepolator.xCerp.valHistory[
                buoyIndex
              ][0],
            coordinate_interpolator_lat_time:
              data.race.buoys[key].coordIntepolator.xCerp.valHistory[
                buoyIndex
              ][1],
            heading_interpolator_value:
              data.race.buoys[key].headingInterp.valHistory[buoyIndex][0],
            heading_interpolator_lat_time:
              data.race.buoys[key].headingInterp.valHistory[buoyIndex][1],
          };
          buoyPositions.push(buoyPosition);
        }
      });

      let roundingTimesKeys = Object.keys(data.race.roundingTimesByMarkId);
      roundingTimesKeys.map((rkey) => {
        let keys = Object.keys(data.race.roundingTimesByMarkId[rkey]);
        for (const key of keys) {
          let roundingTime = {
            id: uuidv4(),
            race_id: raceId,
            race_original_id: data.race.raceId,
            boat_id: boats.find(
              (x) =>
                x.original_id ===
                data.race.roundingTimesByMarkId[rkey][key].boatId,
            ).id,
            boat_original_id: data.race.roundingTimesByMarkId[rkey][key].boatId,
            packet_id: data.race.roundingTimesByMarkId[rkey][key].packetId,
            mark_number: data.race.roundingTimesByMarkId[rkey][key].markNumber,
            time: data.race.roundingTimesByMarkId[rkey][key].time,
          };
          roundingTimes.push(roundingTime);
        }
      });
    }
    if (data.race) {
      let normalizeData = {
        race,
        boats: {
          boats,
          teams,
        },
        boatPositions: {
          boatPositions,
          boatTwds,
          boatTwss,
          boatVmgs,
        },
        buoys: {
          buoys,
          buoyPositions,
          roundingTimes,
        },
        ranking: boatRanks,
        model: [data.appConfig.defaultboatmodel.name],
      };
      await normalizeRace(normalizeData);
    }
  } catch (error) {
    console.log(error);
  }
};

const downloadAndProcessFiles = async (bucketName) => {
  let fileNames = await s3Util.listAllKeys(bucketName);
  const existingData = await getExistingData(SOURCE.AMERICASCUP2021);

  for (const index in fileNames) {
    try {
      const fileName = fileNames[index];
      console.log(
        `Processing file ${fileName} ${index} of ${fileNames.length - 1}`,
      );
      let rawData = await s3Util.getObject(fileName, bucketName);
      let destructuredFileName = fileName.split('-');
      let raceData = JSON.parse(rawData);
      raceData.eventName = destructuredFileName[1].replace('_', ' ');
      raceData.raceName = destructuredFileName[2]
        .replace('.json', '')
        .replace('_', ' ');
      if (!existingData.find((e) => e.original_id == raceData.race.raceId)) {
        await saveAmericasCup2021Data(raceData);
      } else {
        console.log(`Race ${fileName} already exists`);
      }
    } catch (err) {
      console.log(err);
    }
  }
  console.log('Finished saving all races');
};

module.exports = {
  saveAmericasCup2021Data: saveAmericasCup2021Data,
  downloadAndProcessFiles: downloadAndProcessFiles,
};

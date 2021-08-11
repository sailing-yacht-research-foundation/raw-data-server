const data = require('./americasCup2021.json');
module.exports = {
  mockExpectRaceObject: {
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
  },
};

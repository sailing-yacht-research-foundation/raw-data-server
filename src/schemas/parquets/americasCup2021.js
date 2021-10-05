var parquet = require('parquetjs-lite');

const americasCup2021BoatPosition = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  race_id: { type: 'UTF8' },
  race_original_id: { type: 'UTF8' },
  boat_id: { type: 'UTF8' },
  boat_original_id: { type: 'INT64' },
  coordinate_interpolator_lon: { type: 'DOUBLE' },
  coordinate_interpolator_lon_time: { type: 'DOUBLE' },
  coordinate_interpolator_lat: { type: 'DOUBLE' },
  coordinate_interpolator_lat_time: { type: 'DOUBLE' },
  heading_interpolator_value: { type: 'INT64' },
  heading_interpolator_time: { type: 'DOUBLE' },
  heel_interpolator_value: { type: 'INT64' },
  heel_interpolator_time: { type: 'DOUBLE' },
  pitch_interpolator_value: { type: 'INT64' },
  pitch_interpolator_time: { type: 'DOUBLE' },
  dtl_interpolator_value: { type: 'INT64' },
  dtl_interpolator_time: { type: 'DOUBLE' },
  speed_interpolator_value: { type: 'INT64' },
  speed_interpolator_time: { type: 'DOUBLE' },
  elev_interpolator_value: { type: 'INT64' },
  elev_interpolator_time: { type: 'DOUBLE' },
  leg_progress_interpolator_value: { type: 'INT64' },
  leg_progress_interpolator_time: { type: 'DOUBLE' },
});

const americasCup2021Combined = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  event_name: { type: 'UTF8' },
  race_name: { type: 'UTF8' },
  terrain_config_location_lon: { type: 'UTF8' },
  terrain_config_location_lat: { type: 'UTF8' },
  boundary_center_set: { type: 'BOOLEAN' },
  current_leg: { type: 'INT64' },
  min_race_time: { type: 'DOUBLE' },
  max_race_time: { type: 'DOUBLE' },
  last_packet_time: { type: 'DOUBLE' },
  packet_id: { type: 'INT64' },
  start_time: { type: 'INT64' },
  num_legs: { type: 'INT64' },
  course_angle: { type: 'INT64' },
  race_status: { type: 'INT64' },
  boat_type: { type: 'INT64' },
  live_delay_secs: { type: 'INT64' },
  scene_center_utm_lon: { type: 'DOUBLE' },
  scene_center_utm_lat: { type: 'DOUBLE' },
  sim_time: { type: 'DOUBLE' },
  raceStatus: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      race_id: { type: 'UTF8' },
      race_original_id: { type: 'UTF8' },
      race_status_interpolator_value: { type: 'INT64' },
      race_status_interpolator_time: { type: 'DOUBLE', optional: true },
    },
  },
  rankings: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      race_id: { type: 'UTF8' },
      race_original_id: { type: 'UTF8' },
      boat_id: { type: 'UTF8' },
      boat_original_id: { type: 'INT64' },
      rank: { type: 'INT64' },
      leg: { type: 'INT64' },
      dtl: { type: 'INT64' },
      secs_to_leader: { type: 'DOUBLE' },
      penalty_count: { type: 'INT64' },
      protest_active: { type: 'BOOLEAN' },
      status: { type: 'INT64' },
      speed: { type: 'DOUBLE' },
    },
  },
  roundingTimes: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      race_id: { type: 'UTF8' },
      race_original_id: { type: 'UTF8' },
      boat_id: { type: 'UTF8' },
      boat_original_id: { type: 'INT64' },
      packet_id: { type: 'INT64' },
      mark_number: { type: 'INT64' },
      time: { type: 'DOUBLE' },
    },
  },
  teams: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      race_id: { type: 'UTF8' },
      race_original_id: { type: 'UTF8' },
      original_id: { type: 'UTF8' },
      name: { type: 'UTF8' },
      abbreviation: { type: 'UTF8', optional: true },
      flag_id: { type: 'UTF8', optional: true },
      color: { type: 'UTF8', optional: true },
      boat_name: { type: 'UTF8', optional: true },
      top_mast_offset_x: { type: 'INT64', optional: true },
      top_mast_offset_y: { type: 'INT64', optional: true },
      top_mast_offset_z: { type: 'DOUBLE', optional: true },
      default_bow_offset: { type: 'DOUBLE', optional: true },
      jib_target: { type: 'UTF8', optional: true },
      main_sail_target: { type: 'UTF8', optional: true },
      left_foil: { type: 'UTF8', optional: true },
      right_foil: { type: 'UTF8', optional: true },
    },
  },
  boats: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'INT64' },
      race_id: { type: 'UTF8' },
      race_original_id: { type: 'UTF8' },
      team_id: { type: 'UTF8' },
      team_original_id: { type: 'INT64' },
      current_leg: { type: 'INT64' },
      distance_to_leader: { type: 'INT64' },
      rank: { type: 'UTF8' },
      foil_move_time: { type: 'INT64' },
      leftFoilPosition: {
        repeated: true,
        fields: {
          id: { type: 'UTF8' },
          race_id: { type: 'UTF8' },
          race_original_id: { type: 'UTF8' },
          boat_id: { type: 'UTF8' },
          boat_original_id: { type: 'INT64' },
          left_foil_position_interpolator_value: { type: 'DOUBLE' },
          left_foil_position_interpolator_time: { type: 'DOUBLE' },
        },
      },
      leftFoilState: {
        repeated: true,
        fields: {
          id: { type: 'UTF8' },
          race_id: { type: 'UTF8' },
          race_original_id: { type: 'UTF8' },
          boat_id: { type: 'UTF8' },
          boat_original_id: { type: 'INT64' },
          left_foil_state_interpolator_value: { type: 'DOUBLE' },
          left_foil_state_interpolator_time: { type: 'DOUBLE' },
        },
      },
      rightFoilPosition: {
        repeated: true,
        fields: {
          id: { type: 'UTF8' },
          race_id: { type: 'UTF8' },
          race_original_id: { type: 'UTF8' },
          boat_id: { type: 'UTF8' },
          boat_original_id: { type: 'INT64' },
          right_foil_position_interpolator_value: { type: 'DOUBLE' },
          right_foil_position_interpolator_time: { type: 'DOUBLE' },
        },
      },
      rightFoilState: {
        repeated: true,
        fields: {
          id: { type: 'UTF8' },
          race_id: { type: 'UTF8' },
          race_original_id: { type: 'UTF8' },
          boat_id: { type: 'UTF8' },
          boat_original_id: { type: 'INT64' },
          right_foil_state_interpolator_value: { type: 'DOUBLE' },
          right_foil_state_interpolator_time: { type: 'DOUBLE' },
        },
      },
      leg: {
        repeated: true,
        fields: {
          id: { type: 'UTF8' },
          race_id: { type: 'UTF8' },
          race_original_id: { type: 'UTF8' },
          boat_id: { type: 'UTF8' },
          boat_original_id: { type: 'INT64' },
          leg_interpolator_value: { type: 'INT64' },
          leg_interpolator_time: { type: 'DOUBLE' },
        },
      },
      penalty: {
        repeated: true,
        fields: {
          id: { type: 'UTF8' },
          race_id: { type: 'UTF8' },
          race_original_id: { type: 'UTF8' },
          boat_id: { type: 'UTF8' },
          boat_original_id: { type: 'INT64' },
          penalty_count_interpolator_value: { type: 'INT64' },
          penalty_count_interpolator_time: { type: 'DOUBLE' },
        },
      },
      protest: {
        repeated: true,
        fields: {
          id: { type: 'UTF8' },
          race_id: { type: 'UTF8' },
          race_original_id: { type: 'UTF8' },
          boat_id: { type: 'UTF8' },
          boat_original_id: { type: 'INT64' },
          protest_interpolator_value: { type: 'BOOLEAN' },
          protest_interpolator_time: { type: 'DOUBLE' },
        },
      },
      rank: {
        repeated: true,
        fields: {
          id: { type: 'UTF8' },
          race_id: { type: 'UTF8' },
          race_original_id: { type: 'UTF8' },
          boat_id: { type: 'UTF8' },
          boat_original_id: { type: 'INT64' },
          rank_interpolator_value: { type: 'INT64' },
          rank_interpolator_time: { type: 'DOUBLE' },
        },
      },
      rudderAngle: {
        repeated: true,
        fields: {
          id: { type: 'UTF8' },
          race_id: { type: 'UTF8' },
          race_original_id: { type: 'UTF8' },
          boat_id: { type: 'UTF8' },
          boat_original_id: { type: 'INT64' },
          rudder_angle_value: { type: 'DOUBLE' },
          rudder_angle_time: { type: 'DOUBLE' },
        },
      },
      sow: {
        repeated: true,
        fields: {
          id: { type: 'UTF8' },
          race_id: { type: 'UTF8' },
          race_original_id: { type: 'UTF8' },
          boat_id: { type: 'UTF8' },
          boat_original_id: { type: 'INT64' },
          sow_interpolator_value: { type: 'DOUBLE' },
          sow_interpolator_time: { type: 'DOUBLE' },
        },
      },
      status: {
        repeated: true,
        fields: {
          id: { type: 'UTF8' },
          race_id: { type: 'UTF8' },
          race_original_id: { type: 'UTF8' },
          boat_id: { type: 'UTF8' },
          boat_original_id: { type: 'INT64' },
          status_interpolator_value: { type: 'INT64' },
          status_interpolator_time: { type: 'DOUBLE' },
        },
      },
    },
    buoys: {
      id: { type: 'UTF8' },
      race_id: { type: 'UTF8' },
      race_original_id: { type: 'UTF8' },
      original_id: { type: 'INT64' },
      model: { type: 'INT64' },
      first_leg_visible: { type: 'INT64' },
      last_leg_visible: { type: 'INT64' },
    },
  },
});

const americasCup2021BoatTwd = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  race_id: { type: 'UTF8' },
  race_original_id: { type: 'UTF8' },
  boat_id: { type: 'UTF8' },
  boat_original_id: { type: 'INT64' },
  twd_interpolator_value: { type: 'DOUBLE' },
  twd_interpolator_time: { type: 'DOUBLE' },
});

const americasCup2021BoatTws = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  race_id: { type: 'UTF8' },
  race_original_id: { type: 'UTF8' },
  boat_id: { type: 'UTF8' },
  boat_original_id: { type: 'INT64' },
  tws_interpolator_value: { type: 'DOUBLE' },
  tws_interpolator_time: { type: 'DOUBLE' },
});
const americasCup2021BoatVmg = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  race_id: { type: 'UTF8' },
  race_original_id: { type: 'UTF8' },
  boat_id: { type: 'UTF8' },
  boat_original_id: { type: 'INT64' },
  vmg_interpolator_value: { type: 'DOUBLE' },
  vmg_interpolator_time: { type: 'DOUBLE' },
});
const americasCup2021BoundaryPacket = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  race_id: { type: 'UTF8' },
  race_original_id: { type: 'UTF8' },
  packet_id: { type: 'INT64' },
  coordinate_interpolator_lon: { type: 'DOUBLE' },
  coordinate_interpolator_lat: { type: 'DOUBLE' },
});
const americasCup2021BuoyPosition = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  race_id: { type: 'UTF8' },
  race_original_id: { type: 'UTF8' },
  mark_id: { type: 'INT64' },
  coordinate_interpolator_lon: { type: 'DOUBLE' },
  coordinate_interpolator_lon_time: { type: 'DOUBLE' },
  coordinate_interpolator_lat: { type: 'DOUBLE' },
  coordinate_interpolator_lat_time: { type: 'DOUBLE' },
  heading_interpolator_value: { type: 'INT64' },
  heading_interpolator_lat_time: { type: 'DOUBLE' },
});
const americasCup2021BuoyPositionState = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  race_id: { type: 'UTF8' },
  race_original_id: { type: 'UTF8' },
  mark_id: { type: 'INT64' },
  state_interpolator_value: { type: 'INT64' },
  state_interpolator_time: { type: 'DOUBLE' },
});
const americasCup2021WindData = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  race_id: { type: 'UTF8' },
  race_original_id: { type: 'UTF8' },
  wind_heading_value: { type: 'DOUBLE' },
  wind_heading_time: { type: 'DOUBLE' },
  upwind_layline_angle_value: { type: 'DOUBLE' },
  upwind_layline_angle_time: { type: 'DOUBLE' },
  downwind_layline_angle_value: { type: 'DOUBLE' },
  downwind_layline_angle_time: { type: 'DOUBLE' },
  wind_speed_value: { type: 'INT64' },
  wind_speed_time: { type: 'DOUBLE' },
});
const americasCup2021WindPoint = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  race_id: { type: 'UTF8' },
  race_original_id: { type: 'UTF8' },
  wind_point_id: { type: 'INT64' },
  coordinate_interpolator_lon: { type: 'DOUBLE' },
  coordinate_interpolator_lon_time: { type: 'DOUBLE' },
  coordinate_interpolator_lat: { type: 'DOUBLE' },
  coordinate_interpolator_lat_time: { type: 'DOUBLE' },
  heading_interpolator_value: { type: 'INT64' },
  heading_interpolator_lat_time: { type: 'DOUBLE' },
  wind_speed_interpolator_value: { type: 'INT64' },
  wind_speed_interpolator_time: { type: 'DOUBLE' },
});

module.exports = {
  americasCup2021Combined,
  americasCup2021BoatPosition,
  americasCup2021BoatTwd,
  americasCup2021BoatTws,
  americasCup2021BoatVmg,
  americasCup2021BoundaryPacket,
  americasCup2021BuoyPosition,
  americasCup2021BuoyPositionState,
  americasCup2021WindData,
  americasCup2021WindPoint,
};

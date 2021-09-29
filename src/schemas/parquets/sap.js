const parquet = require('parquetjs-lite');

const sapCombined = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'UTF8' },
  regatta: { type: 'UTF8' },
  name: { type: 'UTF8' },
  scoring_system: { type: 'UTF8' },
  ranking_metric: { type: 'UTF8' },
  boat_class: { type: 'UTF8' },
  can_boats_of_competitors_change_per_race: { type: 'UTF8' },
  competitor_registration_type: { type: 'UTF8' },
  user_start_time_inference: { type: 'BOOLEAN' },
  control_tracking_from_start_and_finish_times: { type: 'BOOLEAN' },
  start_of_race_ms: { type: 'INT64' },
  start_of_tracking_ms: { type: 'INT64' },
  newest_tracking_event_ms: { type: 'INT64' },
  end_of_tracking_ms: { type: 'INT64' },
  end_of_race_ms: { type: 'INT64' },
  delay_to_live_ms: { type: 'INT64' },
  courses: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      race_id: { type: 'UTF8' },
      race_original_id: { type: 'UTF8' },
      name: { type: 'UTF8' },
      course_name: { type: 'UTF8' },
      passing_instruction: { type: 'UTF8' },
      class: { type: 'UTF8' },
      passing_instruction: { type: 'UTF8' },
      short_name: { type: 'UTF8' },
      left_class: { type: 'UTF8', optional: true },
      left_type: { type: 'UTF8', optional: true },
      right_class: { type: 'UTF8', optional: true },
      right_type: { type: 'UTF8', optional: true },
    },
  },
  marks: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'UTF8' },
      race_id: { type: 'UTF8' },
      race_original_id: { type: 'UTF8' },
      name: { type: 'UTF8' },
    },
  },
  competitors: {
    repeated: true,
    fields: {
      id: { type: 'UTF8' },
      original_id: { type: 'UTF8' },
      regatta: { type: 'UTF8' },
      name: { type: 'UTF8' },
      short_name: { type: 'UTF8' },
      display_color: { type: 'UTF8', optional: true },
      search_tag: { type: 'UTF8', optional: true },
      nationality: { type: 'UTF8' },
      nationality_iso2: { type: 'UTF8' },
      nationality_iso3: { type: 'UTF8' },
      flag_image_uri: { type: 'UTF8', optional: true },
      time_on_time_factor: { type: 'DOUBLE' },
      time_on_distance_allowance_in_seconds_per_nautical_mile: {
        type: 'DOUBLE',
      },
      boat: {
        repeated: true,
        fields: {
          id: { type: 'UTF8' },
          original_id: { type: 'UTF8' },
          race_id: { type: 'UTF8' },
          race_original_id: { type: 'UTF8' },
          race_name: { type: 'UTF8' },
          regatta: { type: 'UTF8' },
          name: { type: 'UTF8' },
          sail_number: { type: 'UTF8' },
          color: { type: 'UTF8' },
          boat_class_name: { type: 'UTF8' },
          boat_class_typically_start_upwind: { type: 'BOOLEAN' },
          boat_class_hull_length_in_meters: { type: 'DOUBLE' },
          boat_class_hull_beam_in_meters: { type: 'DOUBLE' },
          boat_class_display_name: { type: 'DOUBLE' },
          boat_class_icon_url: { type: 'DOUBLE', optional: true },
        },
      },
      leg: {
        repeated: true,
        fields: {
          id: { type: 'UTF8' },
          race_id: { type: 'UTF8' },
          race_original_id: { type: 'UTF8' },
          competitor_id: { type: 'UTF8' },
          competitor_original_id: { type: 'UTF8' },
          race_name: { type: 'UTF8' },
          regatta: { type: 'UTF8' },
          from: { type: 'UTF8' },
          from_waypoint_id: { type: 'UTF8' },
          to: { type: 'UTF8' },
          to_waypoint_id: { type: 'UTF8' },
          up_or_downwind_leg: { type: 'BOOLEAN' },
          average_sog_kts: { type: 'DOUBLE' },
          tacks: { type: 'INT64' },
          jibes: { type: 'INT64' },
          penalty_circle: { type: 'INT64' },
          time_since_gun_ms: { type: 'INT64' },
          distance_since_gun_m: { type: 'DOUBLE' },
          distance_traveled_m: { type: 'DOUBLE' },
          distance_traveled_including_gate_start: { type: 'DOUBLE' },
          rank: { type: 'INT64' },
          gap_to_leader_s: { type: 'DOUBLE' },
          gap_to_leader_m: { type: 'DOUBLE' },
          started: { type: 'BOOLEAN' },
          finished: { type: 'BOOLEAN' },
        },
      },
      maneuver: {
        repeated: true,
        fields: {
          id: { type: 'UTF8' },
          race_id: { type: 'UTF8' },
          race_original_id: { type: 'UTF8' },
          competitor_id: { type: 'UTF8' },
          competitor_original_id: { type: 'UTF8' },
          maneuver_type: { type: 'UTF8' },
          new_tack: { type: 'UTF8' },
          speed_before_in_knots: { type: 'DOUBLE' },
          cog_before_in_true_degrees: { type: 'DOUBLE' },
          speed_after_in_knots: { type: 'DOUBLE' },
          cog_after_in_true_degrees: { type: 'DOUBLE' },
          direction_change_in_degrees: { type: 'DOUBLE' },
          max_turning_rate_in_degrees_per_second: { type: 'DOUBLE' },
          avg_turning_rate_in_degrees_per_second: { type: 'DOUBLE' },
          lowest_speed_in_knots: { type: 'DOUBLE' },
          mark_passing: { type: 'BOOLEAN' },
          maneuver_loss_geographical_miles: { type: 'DOUBLE', optional: true },
          maneuver_loss_sea_miles: { type: 'DOUBLE', optional: true },
          maneuver_loss_nautical_miles: { type: 'DOUBLE', optional: true },
          maneuver_loss_meters: { type: 'DOUBLE', optional: true },
          maneuver_loss_kilometers: { type: 'DOUBLE', optional: true },
          maneuver_loss_central_angle_deg: { type: 'DOUBLE', optional: true },
          maneuver_loss_central_angle_rad: { type: 'DOUBLE', optional: true },
          position_time_type: { type: 'UTF8' },
          position_time_lat_deg: { type: 'DOUBLE' },
          position_time_lon_deg: { type: 'DOUBLE' },
          position_time_unixtime: { type: 'INT64' },
        },
      },
      mark_passing: {
        repeated: true,
        fields: {
          id: { type: 'UTF8' },
          race_id: { type: 'UTF8' },
          race_original_id: { type: 'UTF8' },
          competitor_id: { type: 'UTF8' },
          competitor_original_id: { type: 'UTF8' },
          competitor_boat_id: { type: 'UTF8' },
          competitor_boat_original_id: { type: 'UTF8' },
          waypoint_name: { type: 'UTF8' },
          zero_based_waypoint_index: { type: 'INT64' },
          time_as_millis: { type: 'INT64' },
          time_as_iso: { type: 'UTF8' },
        },
      },
    },
  },
});

const sapCompetitorBoatPosition = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  competitor_id: { type: 'UTF8' },
  competitor_original_id: { type: 'UTF8' },
  race_id: { type: 'UTF8' },
  race_original_id: { type: 'UTF8' },
  competitor_boat_id: { type: 'UTF8' },
  competitor_boat_original_id: { type: 'UTF8' },
  timepoint_ms: { type: 'INT64' },
  lat_deg: { type: 'DOUBLE', optional: true },
  lng_deg: { type: 'DOUBLE', optional: true },
  truebearing_deg: { type: 'DOUBLE', optional: true },
  speed_kts: { type: 'DOUBLE', optional: true },
});

const sapCompetitorMarkPosition = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  race_id: { type: 'UTF8' },
  race_original_id: { type: 'UTF8' },
  mark_id: { type: 'UTF8' },
  mark_original_id: { type: 'UTF8' },
  timepoint_ms: { type: 'INT64' },
  lat_deg: { type: 'DOUBLE' },
  lng_deg: { type: 'DOUBLE' },
});

module.exports = {
  sapCombined,
  sapCompetitorBoatPosition,
  sapCompetitorMarkPosition,
};
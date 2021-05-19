const db = require('../models');

const Op = db.Sequelize.Op;

const saveGeoracingData = async (data) => {
  if (data.georacingEvent) {
    const existEvents = await db.georacingEvent.findAll({
      where: { id: { [Op.in]: data.georacingEvent.map((row) => row.id) } },
    });
    const toRemove = existEvents.map((row) => row.id);

    const eventData = data.georacingEvent
      .filter((row) => {
        return !toRemove.includes(row.id);
      })
      .map((row) => {
        const {
          id,
          original_id,
          name,
          short_name,
          time_zone,
          description_en,
          description_fr,
          short_description,
          start_time,
          end_time,
        } = row;
        return {
          id,
          original_id,
          name,
          short_name,
          time_zone,
          description_en,
          description_fr,
          short_description,
          start_time,
          end_time,
        };
      });
    await db.georacingEvent.bulkCreate(eventData);
  }
  if (data.georacingRace) {
    const existRaces = await db.georacingRace.findAll({
      where: { id: { [Op.in]: data.georacingRace.map((row) => row.id) } },
    });
    const toRemove = existRaces.map((row) => row.id);

    const raceData = data.georacingRace
      .filter((row) => {
        return !toRemove.includes(row.id);
      })
      .map((row) => {
        const {
          id,
          original_id,
          event,
          event_original_id,
          name,
          short_name,
          short_description,
          time_zone,
          available_time,
          start_time,
          end_time,
          url,
          player_version,
        } = row;
        return {
          id,
          original_id,
          event,
          event_original_id,
          name,
          short_name,
          short_description,
          time_zone,
          available_time,
          start_time,
          end_time,
          url,
          player_version,
        };
      });
    await db.georacingRace.bulkCreate(raceData);
  }
  if (data.georacingActor) {
    const existActors = await db.georacingActor.findAll({
      where: { id: { [Op.in]: data.georacingActor.map((row) => row.id) } },
    });
    const toRemove = existActors.map((row) => row.id);

    const actorData = data.georacingActor
      .filter((row) => {
        return !toRemove.includes(row.id);
      })
      .map((row) => {
        const {
          id,
          original_id,
          race,
          race_original_id,
          event,
          event_original_id,
          tracker_id,
          tracker2_id,
          id_provider_actor,
          team_id,
          profile_id,
          start_number,
          first_name,
          middle_name,
          last_name,
          name,
          big_name,
          short_name,
          members,
          active,
          visible,
          orientation_angle,
          start_time,
          has_penality,
          sponsor_url,
          start_order,
          rating,
          penality,
          penality_time,
          capital1,
          capital2,
          is_security,
          full_name,
          categories,
          categories_name,
          all_info,
          nationality,
          model,
          size,
          team,
          type,
          orientation_mode,
          id_provider_tracker,
          id_provider_tracker2,
          states,
          person,
        } = row;
        return {
          id,
          original_id,
          race,
          race_original_id,
          event,
          event_original_id,
          tracker_id,
          tracker2_id,
          id_provider_actor,
          team_id,
          profile_id,
          start_number,
          first_name,
          middle_name,
          last_name,
          name,
          big_name,
          short_name,
          members,
          active,
          visible,
          orientation_angle,
          start_time,
          has_penality,
          sponsor_url,
          start_order,
          rating,
          penality,
          penality_time,
          capital1,
          capital2,
          is_security,
          full_name,
          categories,
          categories_name,
          all_info,
          nationality,
          model,
          size,
          team,
          type,
          orientation_mode,
          id_provider_tracker,
          id_provider_tracker2,
          states,
          person,
        };
      });
    await db.georacingActor.bulkCreate(actorData);
  }
  if (data.georacingWeather) {
    const existWeathers = await db.georacingWeather.findAll({
      where: { id: { [Op.in]: data.georacingWeather.map((row) => row.id) } },
    });
    const toRemove = existWeathers.map((row) => row.id);

    const weatherData = data.georacingWeather
      .filter((row) => {
        return !toRemove.includes(row.id);
      })
      .map((row) => {
        const {
          id,
          race,
          race_original_id,
          wind_direction,
          wind_strength,
          wind_strength_unit,
          temperature,
          temperature_unit,
          type,
          time,
        } = row;
        return {
          id,
          race,
          race_original_id,
          wind_direction,
          wind_strength,
          wind_strength_unit,
          temperature,
          temperature_unit,
          type,
          time,
        };
      });
    await db.georacingWeather.bulkCreate(weatherData);
  }
  if (data.georacingCourse) {
    const existCourses = await db.georacingCourse.findAll({
      where: { id: { [Op.in]: data.georacingCourse.map((row) => row.id) } },
    });
    const toRemove = existCourses.map((row) => row.id);

    const courseData = data.georacingCourse
      .filter((row) => {
        return !toRemove.includes(row.id);
      })
      .map((row) => {
        const {
          id,
          original_id,
          race,
          race_original_id,
          name,
          active,
          has_track,
          url,
          course_type,
        } = row;
        return {
          id,
          original_id,
          race,
          race_original_id,
          name,
          active,
          has_track,
          url,
          course_type,
        };
      });
    await db.georacingCourse.bulkCreate(courseData);
  }
  if (data.georacingCourseObject) {
    const existCO = await db.georacingCourseObject.findAll({
      where: {
        id: { [Op.in]: data.georacingCourseObject.map((row) => row.id) },
      },
    });
    const toRemove = existCO.map((row) => row.id);

    const coData = data.georacingCourseObject
      .filter((row) => {
        return !toRemove.includes(row.id);
      })
      .map((row) => {
        const {
          id,
          original_id,
          race,
          race_original_id,
          course,
          course_original_id,
          name,
          short_name,
          order,
          raise_event,
          show_layline,
          is_image_reverse,
          altitude_max,
          altitude_min,
          circle_size,
          splittimes_visible,
          hide_on_timeline,
          lap_number,
          distance,
          type,
          role,
          rounding,
          headline_orientation,
        } = row;
        return {
          id,
          original_id,
          race,
          race_original_id,
          course,
          course_original_id,
          name,
          short_name,
          order,
          raise_event,
          show_layline,
          is_image_reverse,
          altitude_max,
          altitude_min,
          circle_size,
          splittimes_visible,
          hide_on_timeline,
          lap_number,
          distance,
          type,
          role,
          rounding,
          headline_orientation,
        };
      });
    await db.georacingCourseObject.bulkCreate(coData);
  }
  if (data.georacingCourseElement) {
    const existCE = await db.georacingCourseElement.findAll({
      where: {
        id: { [Op.in]: data.georacingCourseElement.map((row) => row.id) },
      },
    });
    const toRemove = existCE.map((row) => row.id);

    const ceData = data.georacingCourseElement
      .filter((row) => {
        return !toRemove.includes(row.id);
      })
      .map((row) => {
        const {
          id,
          original_id,
          race,
          race_original_id,
          course,
          course_original_id,
          course_object,
          course_object_original_id,
          name,
          visible,
          distance,
          orientation_angle,
          type,
          course_element_type,
          model,
          size,
          orientation_mode,
          longitude,
          latitude,
          altitude,
        } = row;
        return {
          id,
          original_id,
          race,
          race_original_id,
          course,
          course_original_id,
          course_object,
          course_object_original_id,
          name,
          visible,
          distance,
          orientation_angle,
          type,
          course_element_type,
          model,
          size,
          orientation_mode,
          longitude,
          latitude,
          altitude,
        };
      });
    await db.georacingCourseElement.bulkCreate(ceData);
  }
  if (data.georacingGroundPlace) {
    const existGroundPlace = await db.georacingGroundPlace.findAll({
      where: {
        id: { [Op.in]: data.georacingGroundPlace.map((row) => row.id) },
      },
    });
    const toRemove = existGroundPlace.map((row) => row.id);

    const groundPlaceData = data.georacingGroundPlace
      .filter((row) => {
        return !toRemove.includes(row.id);
      })
      .map((row) => {
        const {
          id,
          original_id,
          race,
          race_original_id,
          place_or_ground,
          name,
          lon,
          lat,
          size,
          zoom_min,
          zoom_max,
        } = row;
        return {
          id,
          original_id,
          race,
          race_original_id,
          place_or_ground,
          name,
          lon,
          lat,
          size,
          zoom_min,
          zoom_max,
        };
      });
    await db.georacingGroundPlace.bulkCreate(groundPlaceData);
  }
  if (data.georacingPosition) {
    const existPositions = await db.georacingPosition.findAll({
      where: {
        id: { [Op.in]: data.georacingPosition.map((row) => row.id) },
      },
    });
    const toRemove = existPositions.map((row) => row.id);

    const positionData = data.georacingPosition
      .filter((row) => {
        return !toRemove.includes(row.id);
      })
      .map((row) => {
        const {
          id,
          trackable_type,
          trackable_id,
          trackable_original_id,
          race,
          race_original_id,
          event,
          event_original_id,
          timestamp,
          lon,
          lat,
          offset,
          r,
          cl,
          d,
          lg,
          lt,
          al,
          s,
          h,
          dtnm,
        } = row;
        return {
          id,
          trackable_type,
          trackable_id,
          trackable_original_id,
          race,
          race_original_id,
          event,
          event_original_id,
          timestamp,
          lon,
          lat,
          offset,
          r,
          cl,
          d,
          lg,
          lt,
          al,
          s,
          h,
          dtnm,
        };
      });
    await db.georacingPosition.bulkCreate(positionData);
  }
  if (data.georacingLine) {
    const existLines = await db.georacingLine.findAll({
      where: {
        id: { [Op.in]: data.georacingLine.map((row) => row.id) },
      },
    });
    const toRemove = existLines.map((row) => row.id);

    const lineData = data.georacingLine
      .filter((row) => {
        return !toRemove.includes(row.id);
      })
      .map((row) => {
        const {
          id,
          original_id,
          race,
          race_original_id,
          name,
          type,
          close,
          percent_factor,
          stroke_dasharray,
          points,
        } = row;
        return {
          id,
          original_id,
          race,
          race_original_id,
          name,
          type,
          close,
          percent_factor,
          stroke_dasharray,
          points,
        };
      });
    await db.georacingLine.bulkCreate(lineData);
  }
  if (data.georacingSplittime) {
    const existSplittimes = await db.georacingSplittime.findAll({
      where: {
        id: { [Op.in]: data.georacingSplittime.map((row) => row.id) },
      },
    });
    const toRemove = existSplittimes.map((row) => row.id);

    const splittimeData = data.georacingSplittime
      .filter((row) => {
        return !toRemove.includes(row.id);
      })
      .map((row) => {
        const {
          id,
          original_id,
          race,
          race_original_id,
          event,
          event_original_id,
          name,
          short_name,
          splittimes_visible,
          hide_on_timeline,
          lap_number,
          role,
        } = row;
        return {
          id,
          original_id,
          race,
          race_original_id,
          event,
          event_original_id,
          name,
          short_name,
          splittimes_visible,
          hide_on_timeline,
          lap_number,
          role,
        };
      });
    await db.georacingSplittime.bulkCreate(splittimeData);
  }
  if (data.georacingSplittimeObject) {
    const existSplittimeObject = await db.georacingSplittimeObject.findAll({
      where: {
        id: { [Op.in]: data.georacingSplittimeObject.map((row) => row.id) },
      },
    });
    const toRemove = existSplittimeObject.map((row) => row.id);

    const splittimeObjectData = data.georacingSplittimeObject
      .filter((row) => {
        return !toRemove.includes(row.id);
      })
      .map((row) => {
        const {
          id,
          original_id,
          actor,
          actor_original_id,
          splittime,
          splittime_original_id,
          capital,
          max_speed,
          duration,
          detection_method_id,
          is_pit_lap,
          run,
          value_in,
          value_out,
          official,
          hours_mandatory_rest,
          rest_not_in_cp,
          rank,
          rr,
          gap,
          time,
          time_out,
        } = row;
        return {
          id,
          original_id,
          actor,
          actor_original_id,
          splittime,
          splittime_original_id,
          capital,
          max_speed,
          duration,
          detection_method_id,
          is_pit_lap,
          run,
          value_in,
          value_out,
          official,
          hours_mandatory_rest,
          rest_not_in_cp,
          rank,
          rr,
          gap,
          time,
          time_out,
        };
      });
    await db.georacingSplittimeObject.bulkCreate(splittimeObjectData);
  }
  return true;
};

module.exports = saveGeoracingData;

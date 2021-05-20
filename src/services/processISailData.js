const temp = require('temp').track();

const db = require('../models');
const Op = db.Sequelize.Op;
const { iSailCombined } = require('../schemas/parquets/iSail');
const yyyymmddFormat = require('../utils/yyyymmddFormat');
const uploadFileToS3 = require('./uploadFileToS3');
const writeToParquet = require('./writeToParquet');

const processISailData = async () => {
  const currentDate = new Date();
  const currentYear = String(currentDate.getUTCFullYear());
  const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const fullDateFormat = yyyymmddFormat(currentDate);
  const dirPath = await temp.mkdir('rds-isail');

  const combinedPath = `${dirPath}/iSailCombined.parquet`;
  const iSailEvents = await db.iSailEvent.findAll({ raw: true });
  const queryEventList = iSailEvents.map((row) => row.id);
  const iSailEventParticipants = await db.iSailEventParticipant.findAll({
    where: { event: { [Op.in]: queryEventList } },
    raw: true,
  });
  const iSailEventTracksData = await db.iSailEventTracksData.findAll({
    where: { event: { [Op.in]: queryEventList } },
    raw: true,
  });
  const iSailTracks = await db.iSailTrack.findAll({
    where: { event: { [Op.in]: queryEventList } },
    raw: true,
  });
  const iSailPositions = await db.iSailPosition.findAll({
    where: { event: { [Op.in]: queryEventList } },
    raw: true,
  });
  const iSailRoundings = await db.iSailRounding.findAll({
    where: { event: { [Op.in]: queryEventList } },
    raw: true,
  });
  const iSailRaces = await db.iSailRace.findAll({
    where: { event: { [Op.in]: queryEventList } },
    raw: true,
  });
  const queryRaceList = iSailRaces.map((row) => row.id);
  const iSailMarks = await db.iSailMark.findAll({
    where: { race: { [Op.in]: queryRaceList } },
    raw: true,
  });
  const iSailStartlines = await db.iSailStartline.findAll({
    where: { race: { [Op.in]: queryRaceList } },
    raw: true,
  });
  const iSailCourseMarks = await db.iSailCourseMark.findAll({
    where: { race: { [Op.in]: queryRaceList } },
    raw: true,
  });
  const iSailResults = await db.iSailResult.findAll({
    where: { race: { [Op.in]: queryRaceList } },
    raw: true,
  });
  const eventData = iSailEvents.map((row) => {
    const {
      id: event_id,
      original_id: original_event_id,
      name,
      start_date,
      start_timezone_type,
      start_timezone,
      stop_date,
      stop_timezone_type,
      stop_timezone,
      club,
      location,
      url,
    } = row;
    return {
      event_id,
      original_event_id,
      name,
      start_date: new Date(start_date),
      start_timezone_type,
      start_timezone,
      stop_date: new Date(stop_date),
      stop_timezone_type,
      stop_timezone,
      club,
      location,
      url,
      participants: JSON.stringify(
        iSailEventParticipants
          .filter((participant) => {
            return participant.event === row.id;
          })
          .map((participant) => {
            return {
              id: participant.id,
              original_id: participant.original_id,
              class: participant.class,
              original_class_id: participant.original_class_id,
              class_name: participant.class_name,
              sail_no: participant.sail_no,
              name: participant.name,
            };
          }),
      ),
      trackData: iSailEventTracksData.find((trackData) => {
        return trackData.event === row.id;
      }),
      tracks: JSON.stringify(
        iSailTracks
          .filter((track) => {
            return track.event === row.id;
          })
          .map((track) => {
            return {
              id: track.id,
              original_id: track.original_id,
              participant: track.participant,
              original_participant_id: track.original_participant_id,
              original_user_id: track.original_user_id,
              user_name: track.user_name,
              start_time: track.start_time,
              stop_time: track.stop_time,
            };
          }),
      ),
      positions: JSON.stringify(
        iSailPositions
          .filter((pos) => {
            return pos.event === row.id;
          })
          .map((pos) => {
            return {
              id: pos.id,
              track: pos.track,
              original_track_id: pos.original_track_id,
              participant: pos.participant,
              original_participant_id: pos.original_participant_id,
              time: pos.time,
              speed: pos.speed,
              heading: pos.heading,
              distance: pos.distance,
              lon: pos.lon,
              lat: pos.lat,
            };
          }),
      ),
      roundings: JSON.stringify(
        iSailRoundings
          .filter((rounding) => {
            return rounding.event === row.id;
          })
          .map((rounding) => {
            return {
              id: rounding.id,
              original_id: rounding.original_id,
              track: rounding.track,
              original_track_id: rounding.original_track_id,
              course_mark: rounding.course_mark,
              original_course_mark_id: rounding.original_course_mark_id,
              time: rounding.time,
              time_since_last_mark: rounding.time_since_last_mark,
              distance_since_last_mark: rounding.distance_since_last_mark,
              rst: rounding.rst,
              rsd: rounding.rsd,
              max_speed: rounding.max_speed,
            };
          }),
      ),
      races: JSON.stringify(
        iSailRaces
          .filter((race) => {
            return race.event === row.id;
          })
          .map((race) => {
            return {
              id: race.id,
              original_id: race.original_id,
              name: race.name,
              start: race.start,
              stop: race.stop,
              wind_direction: race.wind_direction,
              url: race.url,
              marks: iSailMarks
                .filter((mark) => {
                  return mark.race === race.id;
                })
                .map((mark) => {
                  return {
                    id: mark.id,
                    original_id: mark.original_id,
                    name: mark.name,
                    lon: mark.lon,
                    lat: mark.lat,
                  };
                }),
              startlines: iSailStartlines
                .filter((startline) => {
                  return startline.race === race.id;
                })
                .map((startline) => {
                  return {
                    id: startline.id,
                    original_id: startline.original_id,
                    name: startline.name,
                    lon_1: startline.lon1,
                    lon_2: startline.lon2,
                    lat_1: startline.lat1,
                    lat_2: startline.lat2,
                  };
                }),
              courseMarks: iSailCourseMarks
                .filter((courseMark) => {
                  return courseMark.race === race.id;
                })
                .map((courseMark) => {
                  return {
                    id: courseMark.id,
                    original_id: courseMark.original_id,
                    position: courseMark.position,
                    mark: courseMark.mark,
                    original_mark_id: courseMark.original_mark_id,
                    startline: courseMark.startline,
                    original_startline_id: courseMark.original_startline_id,
                  };
                }),
              results: iSailResults
                .filter((result) => {
                  return result.race === race.id;
                })
                .map((result) => {
                  return {
                    id: result.id,
                    original_id: result.original_id,
                    name: result.name,
                    points: result.points,
                    time: result.time,
                    finaled: result.finaled,
                    participant: result.participant,
                    original_participant_id: result.original_participant_id,
                  };
                }),
            };
          }),
      ),
    };
  });
  await writeToParquet(eventData, iSailCombined, combinedPath);
  const fileUrl = await uploadFileToS3(
    combinedPath,
    `iSail/year=${currentYear}/month=${currentMonth}/isail_${fullDateFormat}.parquet`,
  );
  temp.cleanup();
  return fileUrl;
};

module.exports = processISailData;

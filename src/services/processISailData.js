const temp = require('temp').track();

const db = require('../models');
const Op = db.Sequelize.Op;
const yyyymmddFormat = require('../utils/yyyymmddFormat');
const { iSailCombinedToParquet } = require('./iSailToParquet');
const uploadFileToS3 = require('./uploadFileToS3');

const processISailData = async () => {
  const currentDate = new Date();
  const currentYear = String(currentDate.getUTCFullYear());
  const currentMonth = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const fullDateFormat = yyyymmddFormat(currentDate);

  let dirPath = await temp.mkdir('rds-isail');

  //   const racePath = `${dirPath}/iSailRaces.parquet`;
  //   const iSailRaces = await db.iSailRace.findAll({ raw: true });
  //   await iSailRaceToParquet(iSailRaces, racePath);
  //   await uploadFileToS3(
  //     racePath,
  //     `iSail_races/year=${currentYear}/month=${currentMonth}/isail_races_${fullDateFormat}.parquet`,
  //   );

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
  const iSailRaces = await db.iSailRace.findAll({
    where: { event: { [Op.in]: queryEventList } },
    raw: true,
  });
  const queryRaceList = iSailRaces.map((row) => row.id);
  const iSailMarks = await db.iSailMark.findAll({
    where: { race: { [Op.in]: queryRaceList } },
    raw: true,
  });
  const iSailCourseMarks = await db.iSailCourseMark.findAll({
    where: { race: { [Op.in]: queryRaceList } },
    raw: true,
  });
  const eventData = iSailEvents.map((row) => {
    const {
      id,
      original_id,
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
      id,
      original_id,
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
      participants: iSailEventParticipants
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
      races: iSailRaces
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
          };
        }),
      trackData: iSailEventTracksData.find((trackData) => {
        return trackData.event === row.id;
      }),
      tracks: iSailTracks
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
      positions: iSailPositions
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
    };
  });
  await iSailCombinedToParquet(eventData, combinedPath);
  const fileUrl = await uploadFileToS3(
    combinedPath,
    `iSail/year=${currentYear}/month=${currentMonth}/isail_${fullDateFormat}.parquet`,
  );
  temp.cleanup();
  return fileUrl;
};

module.exports = processISailData;

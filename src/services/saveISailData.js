const db = require('../models');

const Op = db.Sequelize.Op;

const saveISailData = async (data) => {
  if (data.iSailClass) {
    const existClasses = await db.iSailClass.findAll({
      where: { id: { [Op.in]: data.iSailClass.map((row) => row.id) } },
    });
    const toRemove = existClasses.map((row) => row.id);

    const classData = data.iSailClass
      .filter((row) => {
        return !toRemove.includes(row.id);
      })
      .map((row) => {
        return {
          id: row.id,
          original_id: row.original_id,
          name: row.name,
        };
      });
    await db.iSailClass.bulkCreate(classData);
  }
  if (data.iSailEvent) {
    // This field contains only a single object
    const existEvent = await db.iSailEvent.findByPk(data.iSailEvent.id);
    if (!existEvent) {
      await db.iSailEvent.create(data.iSailEvent);
    }
  }
  if (data.iSailRace) {
    const existRaces = await db.iSailRace.findAll({
      where: { id: { [Op.in]: data.iSailRace.map((row) => row.id) } },
    });
    const toRemove = existRaces.map((row) => row.id);

    const raceData = data.iSailRace
      .filter((row) => {
        return !toRemove.includes(row.id);
      })
      .map((row) => {
        return {
          id: row.id,
          original_id: row.original_id,
          event: row.event,
          original_event_id: row.original_event_id,
          name: row.name,
          start: row.start,
          stop: row.stop,
          wind_direction: row.wind_direction,
          url: row.url,
        };
      });
    await db.iSailRace.bulkCreate(raceData);
  }
  if (data.iSailEventParticipant) {
    const existParticipants = await db.iSailEventParticipant.findAll({
      where: {
        id: { [Op.in]: data.iSailEventParticipant.map((row) => row.id) },
      },
    });
    const toRemove = existParticipants.map((row) => row.id);

    const participantData = data.iSailEventParticipant
      .filter((row) => {
        return !toRemove.includes(row.id);
      })
      .map((row) => {
        return {
          id: row.id,
          original_id: row.original_id,
          class: row.class,
          original_class_id: row.original_class_id,
          class_name: row.class_name,
          sail_no: row.sail_no,
          event: row.event,
          original_event_id: row.original_event_id,
          name: row.name,
        };
      });
    await db.iSailEventParticipant.bulkCreate(participantData);
  }
  if (data.iSailEventTracksData) {
    // This field contains only a single object
    const existEventTrack = await db.iSailEventTracksData.findByPk(
      data.iSailEventTracksData.id,
    );
    if (!existEventTrack) {
      await db.iSailEventTracksData.create(data.iSailEventTracksData);
    }
  }
  if (data.iSailTrack) {
    const existTracks = await db.iSailTrack.findAll({
      where: { id: { [Op.in]: data.iSailTrack.map((row) => row.id) } },
    });
    const toRemove = existTracks.map((row) => row.id);

    const trackData = data.iSailTrack
      .filter((row) => {
        return !toRemove.includes(row.id);
      })
      .map((row) => {
        return {
          id: row.id,
          original_id: row.original_id,
          event: row.event,
          original_event_id: row.original_event_id,
          track_data: row.track_data,
          participant: row.participant,
          original_participant_id: row.original_participant_id,
          class: row.class,
          original_class_id: row.original_class_id,
          original_user_id: row.original_user_id,
          user_name: row.user_name,
          start_time: row.start_time,
          stop_time: row.stop_time,
        };
      });
    await db.iSailTrack.bulkCreate(trackData);
  }
  if (data.iSailPosition) {
    const existPositions = await db.iSailPosition.findAll({
      where: { id: { [Op.in]: data.iSailPosition.map((row) => row.id) } },
    });
    const toRemove = existPositions.map((row) => row.id);

    const positionData = data.iSailPosition
      .filter((row) => {
        return !toRemove.includes(row.id);
      })
      .map((row) => {
        return {
          id: row.id,
          event: row.event,
          original_event_id: row.original_event_id,
          track_data: row.track_data,
          track: row.track,
          original_track_id: row.original_track_id,
          participant: row.participant,
          original_participant_id: row.original_participant_id,
          class: row.class,
          original_class_id: row.original_class_id,
          time: row.time,
          speed: row.speed,
          heading: row.heading,
          distance: row.distance,
          lon: row.lon,
          lat: row.lat,
        };
      });
    await db.iSailPosition.bulkCreate(positionData);
  }
  return true;
};

module.exports = saveISailData;

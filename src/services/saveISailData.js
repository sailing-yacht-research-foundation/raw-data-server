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
    const existEvents = await db.iSailEvent.findAll({
      where: { id: { [Op.in]: data.iSailEvent.map((row) => row.id) } },
    });
    const toRemove = existEvents.map((row) => row.id);

    const eventData = data.iSailEvent
      .filter((row) => {
        return !toRemove.includes(row.id);
      })
      .map((row) => {
        return {
          id: row.id,
          original_id: row.original_id,
          name: row.name,
          start_date: row.start_date,
          start_timezone_type: row.start_timezone_type,
          start_timezone: row.start_timezone,
          stop_date: row.stop_date,
          stop_timezone_type: row.stop_timezone_type,
          stop_timezone: row.stop_timezone,
          club: row.club,
          location: row.location,
          url: row.url,
        };
      });
    await db.iSailEvent.bulkCreate(eventData);
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
  return true;
};

module.exports = saveISailData;

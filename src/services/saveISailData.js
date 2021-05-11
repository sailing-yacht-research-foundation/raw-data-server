const db = require('../models');

const Op = db.Sequelize.Op;
const { iSailClass, iSailEvent } = db;

const saveISailData = async (data) => {
  let classData = [];
  let eventData = [];
  if (data.iSailClass) {
    const existClasses = await iSailClass.findAll({
      where: { id: { [Op.in]: data.iSailClass.map((row) => row.id) } },
    });
    const toRemove = existClasses.map((row) => row.id);

    classData = data.iSailClass
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
  }
  if (data.iSailEvent) {
    const existEvents = await iSailEvent.findAll({
      where: { id: { [Op.in]: data.iSailEvent.map((row) => row.id) } },
    });
    const toRemove = existEvents.map((row) => row.id);

    eventData = data.iSailEvent
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
  }

  try {
    await db.sequelize.transaction(async (t) => {
      await iSailClass.bulkCreate(classData, { transaction: t });
      await iSailEvent.bulkCreate(eventData, { transaction: t });
    });
  } catch (err) {
    console.error(err);
  }
  return true;
};

module.exports = saveISailData;

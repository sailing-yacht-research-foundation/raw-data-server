const dataAccess = require('../../syrf-schema/dataAccess/v1/markTracker');
const db = require('../../syrf-schema/index');
const Op = db.Sequelize.Op;
exports.upsert = async (id, { name, calendarEventId }, transaction) => {
  const now = Date.now();
  const data = {
    name,
    calendarEventId,
    createdAt: now,
    updatedAt: now,
  };
  return await dataAccess.upsert(id, data, transaction);
};

exports.getPointsByTrackerIds = async (ids = []) => {
  const points = await db.CoursePoint.findAll({
    where: { markTrackerId: { [Op.in]: ids } },
  });
  return points;
};

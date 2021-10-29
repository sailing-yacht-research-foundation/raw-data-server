const dataAccess = require('../../syrf-schema/dataAccess/v1/vesselParticipantGroup');

exports.upsert = async (id, { name, calendarEventId }, transaction) => {
  const now = Date.now();
  const groupToSave = {
    name,
    calendarEventId,
    createdAt: now,
    updatedAt: now,
  };

  return await dataAccess.upsert(id, groupToSave, transaction);
};

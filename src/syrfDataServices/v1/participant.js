const dataAccess = require('../../syrf-schema/dataAccess/v1//participant');

exports.upsert = async (
  id,
  { publicName, calendarEventId } = {},
  transaction,
) => {
  const now = Date.now();
  const participantToSave = {
    calendarEventId,
    publicName,
    createAt: now,
    updatedAt: now,
  };

  return await dataAccess.upsert(id, participantToSave, transaction);
};

exports.bulkCreate = async (data, transaction) => {
  return await dataAccess.bulkCreate(data, transaction);
};

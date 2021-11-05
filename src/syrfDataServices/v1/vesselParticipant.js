const dataAccess = require('../../syrf-schema/dataAccess/v1/vesselParticipant');

exports.upsert = async (
  id,
  {
    vesselId,
    vesselParticipantGroupId,
    vesselParticipantId,
    polars,
    handicap,
  } = {},
  transaction = undefined,
) => {
  const now = Date.now();
  const participantToSave = {
    vesselParticipantId,
    vesselId,
    vesselParticipantGroupId,
    polars,
    handicap,
    createdAt: now,
    updatedAt: now,
  };

  const result = await dataAccess.upsert(id, participantToSave, transaction);

  return result;
};

exports.addParticipant = async ({
  vesselParticipantId,
  participantIds = [],
}) => {
  const result = await dataAccess.addParticipant(
    vesselParticipantId,
    participantIds,
  );

  return result;
};

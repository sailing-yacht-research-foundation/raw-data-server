const dataAccess = require('../../syrf-schema/dataAccess/v1/vesselParticipant');
const searchDataSyncSvc = require('./elasticSearchDataSync');
const vpgDAL = require('../../syrf-schema/dataAccess/v1/vesselParticipantGroup');
const { errorCodes, statusCodes } = require('../../syrf-schema/enums');
const {
  setUpdateMeta,
  setCreateMeta,
  ServiceError,
  validateSqlDataAuth,
  ValidationError,
} = require('../../syrf-schema/utils/utils');

exports.upsert = async (
  id,
  { vesselId, vesselParticipantGroupId, vesselParticipantId, polars } = {},
  user,
  transaction = undefined,
) => {
  const isNew = !id;
  let res = null;
  const getById = isNew ? Promise.resolve(null) : dataAccess.getById(id);

  let queryResult = await Promise.all([
    getById,
    vpgDAL.getById(vesselParticipantGroupId),
  ]);

  res = queryResult[0];
  let vpgDetail = queryResult[1];

  if (id && !res)
    throw new ServiceError(
      'Not Found',
      statusCodes.NOT_FOUND,
      errorCodes.DATA_NOT_FOUND,
    );

  if (isNew) {
    res = {};
    res = setCreateMeta(res, user);
  }

  res.vesselParticipantId = vesselParticipantId;
  res.vesselId = vesselId;
  res.vesselParticipantGroupId = vesselParticipantGroupId;
  res.polars = polars;
  res = setUpdateMeta(res, user);

  const vesselParticipantValidationResult = await dataAccess.validateVesselIds(
    vesselParticipantGroupId,
    id,
    vesselId,
  );

  if (vesselParticipantValidationResult.length > 0) {
    throw new ValidationError(
      'Vessel already exists in this group',
      vesselParticipantValidationResult.map((t) => t?.toJSON()),
      statusCodes.UNPROCESSABLE_ENTITY,
      errorCodes.DATA_VALIDATION_FAILED,
    );
  }

  const result = await dataAccess.upsert(id, res, transaction);

  if (vpgDetail)
    await searchDataSyncSvc.competitionUnitSync(vpgDetail.competitionUnitId);

  return result;
};

exports.getAll = async (paging, vesselParticipantGroupId) => {
  return await dataAccess.getAll(paging, vesselParticipantGroupId);
};

exports.getById = async (id, vesselParticipantGroupId) => {
  let result = await dataAccess.getById(id);

  if (!result)
    throw new ServiceError(
      'Not Found',
      statusCodes.NOT_FOUND,
      errorCodes.DATA_NOT_FOUND,
    );
  if (
    vesselParticipantGroupId &&
    result.vesselParticipantGroupId !== vesselParticipantGroupId
  )
    throw new ServiceError(
      'Not Found',
      statusCodes.NOT_FOUND,
      errorCodes.DATA_NOT_FOUND,
    );

  return result;
};

exports.delete = async (id, user, vesselParticipantGroupId) => {
  let result = await dataAccess.getById(id);

  if (!result)
    throw new ServiceError(
      'Not Found',
      statusCodes.NOT_FOUND,
      errorCodes.DATA_NOT_FOUND,
    );
  if (
    vesselParticipantGroupId &&
    result.vesselParticipantGroupId !== vesselParticipantGroupId
  )
    throw new ServiceError(
      'Not Found',
      statusCodes.NOT_FOUND,
      errorCodes.DATA_NOT_FOUND,
    );

  const queryResult = await Promise.all([
    vpgDAL.getById(result.vesselParticipantGroupId),
    dataAccess.delete(id),
  ]);

  await searchDataSyncSvc.competitionUnitSync(
    queryResult[0]?.competitionUnitId,
  );

  return result;
};

exports.addParticipant = async (
  { vesselParticipantId, participantIds = [] },
  user,
) => {
  let vesselParticipantObj = await dataAccess.getByParticipantAndId(
    vesselParticipantId,
    participantIds,
  );

  if (!vesselParticipantObj) {
    throw new ServiceError(
      'Not Found',
      statusCodes.NOT_FOUND,
      errorCodes.DATA_NOT_FOUND,
    );
  }

  let validation = await dataAccess.validateParticipants(
    vesselParticipantObj.vesselParticipantGroupId,
    vesselParticipantId,
    participantIds,
  );

  if (validation.length > 0) {
    throw new ValidationError(
      'Participant already exists in other Vessel Participant',
      validation.map((t) => t?.toJSON()),
      statusCodes.UNPROCESSABLE_ENTITY,
      errorCodes.DATA_VALIDATION_FAILED,
    );
  }

  if (vesselParticipantObj.participants.length > 0) {
    throw new ValidationError(
      'Some participant already exists in this Vessel Participant',
      vesselParticipantObj.participants,
      statusCodes.UNPROCESSABLE_ENTITY,
      errorCodes.DATA_VALIDATION_FAILED,
    );
  }

  const result = await dataAccess.addParticipant(
    vesselParticipantId,
    participantIds,
  );

  return result;
};

exports.removeParticipant = async (
  { vesselParticipantId, participantId },
  user,
) => {
  let vesselParticipantObj = await dataAccess.getByParticipantAndId(
    vesselParticipantId,
    [participantId],
  );

  if (!vesselParticipantObj) {
    throw new ValidationError(
      'Vessel Participant not found',
      null,
      statusCodes.NOT_FOUND,
      errorCodes.DATA_VALIDATION_FAILED,
    );
  }

  if (
    vesselParticipantObj.participants.findIndex((t) => t.id === participantId) <
    0
  ) {
    throw new ValidationError(
      'Participant is not exists in this Vessel Participant',
      null,
      statusCodes.NOT_FOUND,
      errorCodes.DATA_VALIDATION_FAILED,
    );
  }

  const result = await dataAccess.removeParticipant(
    vesselParticipantId,
    participantId,
  );

  return {
    deletedRowCount: result,
  };
};

exports.getParticipantInVesselById = async (
  vesselParticipantId,
  participantId,
) => {
  let vesselParticipantObj = await dataAccess.getByParticipantAndId(
    vesselParticipantId,
    [participantId],
  );

  if (!vesselParticipantObj) {
    throw new ValidationError(
      'Vessel Participant not found',
      null,
      statusCodes.NOT_FOUND,
      errorCodes.DATA_VALIDATION_FAILED,
    );
  }
  if (vesselParticipantObj.participants?.length <= 0) {
    throw new ValidationError(
      'Participant not found',
      null,
      statusCodes.NOT_FOUND,
      errorCodes.DATA_VALIDATION_FAILED,
    );
  }

  return vesselParticipantObj.participants[0];
};

exports.getAllByEvent = async (calendarEventId, paging) => {
  return await dataAccess.getAllByEvent(calendarEventId, paging);
};

exports.getByGroupParticipant = async (
  vesselParticipantGroupId,
  participantId,
) => {
  return await dataAccess.getByGroupParticipant(
    vesselParticipantGroupId,
    participantId,
  );
};

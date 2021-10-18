const dataAccess = require('../../syrf-schema/dataAccess/v1/vesselParticipantGroup');
const eventSVC = require('./calendarEvent');
const { errorCodes } = require('../../syrf-schema/enums');
const {
  setUpdateMeta,
  setCreateMeta,
  ValidationError,
  statusCodes,
} = require('../../syrf-schema/utils/utils');

exports.upsert = async (
  id,
  { vesselParticipantGroupId, name, calendarEventId = null } = {},
  user,
  transaction,
) => {
  const isNew = !id;

  let res = isNew ? null : await dataAccess.getById(id);

  if (id && !res)
    throw new ValidationError(
      'Not Found',
      null,
      statusCodes.NOT_FOUND,
      errorCodes.DATA_NOT_FOUND,
    );

  if (isNew) {
    if (calendarEventId) {
      const eventData = await eventSVC.getById(calendarEventId);
      const { id: eventId, name: eventName } = eventData;
      res = {
        event: { id: eventId, name: eventName },
      };
    } else {
      res = {};
    }

    res = setCreateMeta(res, user);
  }

  res.vesselParticipantGroupId = vesselParticipantGroupId;
  res.name = name;

  if (isNew) {
    res.calendarEventId = calendarEventId;
  }

  res = setUpdateMeta(res, user);
  return await dataAccess.upsert(id, res, transaction);
};

exports.getAll = async (paging, calendarEventId) => {
  return await dataAccess.getAll(paging, calendarEventId);
};

exports.getById = async (id, competitionUnitId) => {
  let result = await dataAccess.getById(id);

  if (!result)
    throw new ValidationError(
      'Not Found',
      null,
      statusCodes.NOT_FOUND,
      errorCodes.DATA_NOT_FOUND,
    );
  if (competitionUnitId && result.competitionUnitId !== competitionUnitId)
    throw new ValidationError(
      'Not Found',
      null,
      statusCodes.NOT_FOUND,
      errorCodes.DATA_NOT_FOUND,
    );

  return result;
};

exports.getByCompetitionId = async (competitionUnitId) => {
  let result = await dataAccess.getByCompetitionId(competitionUnitId);

  if (!result)
    throw new ValidationError(
      'Not Found',
      null,
      statusCodes.NOT_FOUND,
      errorCodes.DATA_NOT_FOUND,
    );

  return result;
};

exports.delete = async (id, competitionUnitId) => {
  let result = await dataAccess.delete(id);

  if (!result)
    throw new ValidationError(
      'Not Found',
      null,
      statusCodes.NOT_FOUND,
      errorCodes.DATA_NOT_FOUND,
    );
  if (competitionUnitId && result.competitionUnitId !== competitionUnitId)
    throw new ValidationError(
      'Not Found',
      null,
      statusCodes.NOT_FOUND,
      errorCodes.DATA_NOT_FOUND,
    );

  return result;
};

exports.getUnregisteredVessel = async (paging, vesselParticipantGroupId) => {
  return await dataAccess.getUnregisteredVessel(
    paging,
    vesselParticipantGroupId,
  );
};

exports.getUnregisteredParticipants = async (
  paging,
  vesselParticipantGroupId,
) => {
  return await dataAccess.getUnregisteredParticipants(
    paging,
    vesselParticipantGroupId,
  );
};

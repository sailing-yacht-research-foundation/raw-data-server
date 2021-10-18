const dataAccess = require('../../syrf-schema/dataAccess/v1/vessel');
const { errorCodes } = require('../../syrf-schema/enums');
const {
  setUpdateMeta,
  setCreateMeta,
  ServiceError,
  statusCodes,
} = require('../../syrf-schema/utils/utils');

exports.upsert = async (
  id,
  {
    publicName,
    vesselId,
    globalId,
    lengthInMeters,
    orcJsonPolars,
    scope,
    bulkCreated = false,
  } = {},
  user,
  transaction,
) => {
  const isNew = !id;

  let res = isNew ? null : await dataAccess.getById(id);

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

  res.publicName = publicName;
  res.vesselId = vesselId;
  res.globalId = globalId;
  res.lengthInMeters = lengthInMeters;
  res.orcJsonPolars = orcJsonPolars;
  res.scope = scope;
  res.bulkCreated = bulkCreated;

  res = setUpdateMeta(res, user);

  return await dataAccess.upsert(id, res, transaction);
};

exports.getAll = async (paging) => {
  return await dataAccess.getAll(paging);
};

exports.getById = async (id) => {
  let result = await dataAccess.getById(id);

  if (!result)
    throw new ServiceError(
      'Not Found',
      statusCodes.NOT_FOUND,
      errorCodes.DATA_NOT_FOUND,
    );

  return result;
};

exports.delete = async (id) => {
  let result = await dataAccess.delete(id);

  if (!result)
    throw new ServiceError(
      'Not Found',
      statusCodes.NOT_FOUND,
      errorCodes.DATA_NOT_FOUND,
    );

  return result;
};

exports.getAllForEvent = async (userId, eventId, paging) => {
  return await dataAccess.getAllForEvent(userId, eventId, paging);
};

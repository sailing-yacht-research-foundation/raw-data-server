const uuid = require('uuid');
const dataAccess = require('../../syrf-schema/dataAccess/v1//participant');
const eventSVC = require('./calendarEvent');
let dynamicLinkAPI = require('../../syrf-schema/externalServices/dynamicLinkAPI.j');
const { errorCodes, statusCodes } = require('../../syrf-schema/enums');
const {
  setUpdateMeta,
  setCreateMeta,
  ServiceError,
  ValidationError,
} = require('../../syrf-schema/utils/utils');

exports.upsert = async (
  id,
  { participantId, publicName, calendarEventId, userProfileId } = {},
  user,
  transaction = undefined,
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
    const eventData = await eventSVC.getById(calendarEventId);
    const { id: eventId, name: eventName, editors, owner, isOpen } = eventData;
    res = {
      event: { id: eventId, name: eventName, editors, owner, isOpen },
    };
    res = setCreateMeta(res, user);
  }

  res.publicName = publicName;
  res.participantId = participantId;
  res.userProfileId = userProfileId;

  if (isNew) {
    id = uuid.v4();
    const dynamicLink = await dynamicLinkAPI.create.exec(
      `${process.env.DEEP_LINK_BASE_URL}/tracker/${id}`,
    );
    if (!dynamicLink?.data?.shortLink)
      throw new ServiceError('create dynamic link failed');
    res.trackerUrl = dynamicLink?.data?.shortLink;
    res.calendarEventId = calendarEventId;
  }

  res = setUpdateMeta(res, user);

  return await dataAccess.upsert(id, res, transaction);
};

exports.registerUser = async (id, user) => {
  let res = await dataAccess.getById(id);

  if (!res)
    throw new ValidationError(
      'Not Found',
      null,
      statusCodes.NOT_FOUND,
      errorCodes.DATA_NOT_FOUND,
    );

  if (res.userProfileId && res.userProfileId !== user.id) {
    let message = 'Participant already associated to other user';

    throw new ValidationError(
      message,
      null,
      statusCodes.BAD_REQUEST,
      errorCodes.DATA_VALIDATION_FAILED,
    );
  }

  if (res.userProfileId === user.id) {
    return res;
  }

  res.userProfileId = user.id;

  res = setUpdateMeta(res, user);

  return await dataAccess.upsert(id, res);
};

exports.getAll = async (paging, calendarEventId, assigned = null) => {
  return await dataAccess.getAll(paging, calendarEventId, assigned);
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

exports.delete = async (id, user) => {
  let data = await dataAccess.getById(id);
  if (!data) {
    throw new ServiceError(
      'Not Found',
      statusCodes.NOT_FOUND,
      errorCodes.DATA_NOT_FOUND,
    );
  }

  const { owner, editors } = data.event;
  // Only the user (userProfile), owner of event, and editors of event (admins) can delete
  if (
    data.userProfileId !== user.id &&
    owner.id !== user.id &&
    editors.findIndex((row) => row.id === user.id) === -1
  ) {
    throw new ServiceError(
      'Unauthorized',
      statusCodes.UNAUTHORIZED,
      errorCodes.UNAUTHORIZED_DATA_CHANGE,
    );
  }
  let result = await dataAccess.delete(id);

  return result;
};

exports.getEventById = async (id) => {
  let result = await dataAccess.getEvent(id);

  if (!result?.event)
    throw new ServiceError(
      'Not Found',
      statusCodes.NOT_FOUND,
      errorCodes.DATA_NOT_FOUND,
    );

  return result.event;
};

exports.getRacesById = async (id, pagination, vessel) => {
  let queryResult = await dataAccess.getRaces(id, pagination, vessel);

  if (!queryResult)
    throw new ServiceError(
      'Not Found',
      statusCodes.NOT_FOUND,
      errorCodes.DATA_NOT_FOUND,
    );

  return queryResult;
};

exports.getParticipationByUserId = async (id, pagination) => {
  let result = await dataAccess.getByUserId(id, pagination);

  return result;
};

exports.getByUserAndEvent = async (userId, eventId) => {
  let result = await dataAccess.getByUserAndEvent(userId, eventId);

  return result;
};

const { zonedTimeToUtc } = require('date-fns-tz');
const dataAccess = require('../../syrf-schema/dataAccess/v1/competitionUnit');

const {
  setUpdateMeta,
  setCreateMeta,
} = require('../../utils/syrfDatabaseUtil');

exports.upsert = async (
  id,
  {
    name,
    startTime,
    approximateStart,
    approximateStart_zone = 'Etc/UTC',
    isCompleted,
    boundingBox,
    vesselParticipantGroupId,
    courseId,
    calendarEventId,
    endTime,
    timeLimit,
    description,
  } = {},
  user,
) => {
  const isNew = !id;

  let res = await dataAccess.getById(id);

  if (id && !res) {
    throw new Error('Competition Unit not found');
  }

  if (isNew) {
    res = {
      owner: user.id,
      editors: [user.id],
    };

    res = setCreateMeta(res, user);
  }

  const startDateObj = new Date(approximateStart);

  if (!isNaN(startDateObj.getTime())) {
    res.approximateStart = approximateStart;
    res.approximateStart_zone = approximateStart_zone;
    res.approximateStart_utc = zonedTimeToUtc(
      startDateObj,
      approximateStart_zone,
    );
  } else {
    res.approximateStart = null;
    res.approximateStart_zone = null;
    res.approximateStart_utc = null;
  }

  res.name = name;
  res.startTime = startTime;
  res.approximateStart = approximateStart;
  res.isCompleted = isCompleted;
  res.boundingBox = boundingBox;
  res.vesselParticipantGroupId = vesselParticipantGroupId;
  res.courseId = courseId;
  res.calendarEventId = calendarEventId;
  res.endTime = endTime;
  res.timeLimit = timeLimit;
  res.description = description;

  res = setUpdateMeta(res, user);
  const result = await dataAccess.upsert(id, res);

  return result;
};

exports.getAll = async (paging, calendarEventId) => {
  return await dataAccess.getAll(paging, calendarEventId);
};

exports.getById = async (id, calendarEventId) => {
  let result = await dataAccess.getById(id);

  if (!result) {
    throw new Error('Competition Unit not found');
  }
  if (calendarEventId && result.calendarEventId !== calendarEventId) {
    throw new Error('Calendar Event not found');
  }

  return result;
};

exports.delete = async (id, calendarEventId) => {
  let result = await dataAccess.getById(id);

  if (!result) {
    throw new Error('Competition Unit not found');
  }
  if (calendarEventId && result.calendarEventId !== calendarEventId) {
    throw new Error('Calendar Event not found');
  }

  await dataAccess.delete(id);

  return result;
};

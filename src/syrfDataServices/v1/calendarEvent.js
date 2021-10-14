const { zonedTimeToUtc } = require('date-fns-tz');
const dataAccess = require('../../syrfDataAccess/v1/calendarEvent');
const { errorCodes } = require('../../enums');
const {
  setUpdateMeta,
  setCreateMeta,
  ServiceError,
  statusCodes,
  validateSqlDataAuth,
} = require('../../utils/utils');
const {
  findClosestCity,
  findClosestCountry,
} = require('../../utils/closestLocation');

exports.upsert = async (
  id,
  {
    name,
    externalUrl,
    approximateStartTime,
    approximateStartTime_zone = 'Etc/UTC',
    ics,
    lat,
    lon,
    isPrivate,
    locationName,
    approximateEndTime,
    approximateEndTime_zone = 'Etc/UTC',
    description,
    country,
    city,
    isPubliclyViewable = true,
    editors = [],
    isOpen = true, // Default open for event creation flow
    source = null,
  } = {},
  user,
) => {
  const isNew = !id;

  let res = await dataAccess.getById(id);

  if (id && !res)
    throw new ServiceError(
      'Not Found',
      statusCodes.NOT_FOUND,
      errorCodes.DATA_NOT_FOUND,
    );

  if (isNew) {
    res = {
      ownerId: user.id,
      editors: [{ id: user.id }],
    };

    res = setCreateMeta(res, user);
  }

  const dataAuth = validateSqlDataAuth(res, user.id);

  if (!dataAuth.isEditor && !dataAuth.isOwner)
    throw new ServiceError(
      'Unauthorized',
      statusCodes.UNAUTHORIZED,
      errorCodes.UNAUTHORIZED_DATA_CHANGE,
    );

  const startDateObj = new Date(approximateStartTime);

  const endDateObj = new Date(approximateEndTime);

  if (!isNaN(startDateObj.getTime())) {
    res.approximateStartTime = approximateStartTime;
    res.approximateStartTime_zone = approximateStartTime_zone;
    res.approximateStartTime_utc = zonedTimeToUtc(
      startDateObj,
      approximateStartTime_zone,
    );
    res.startDay = res.approximateStartTime_utc.getDate();
    res.startMonth = res.approximateStartTime_utc.getMonth() + 1;
    res.startYear = res.approximateStartTime_utc.getFullYear();
  } else {
    res.approximateStartTime = null;
    res.startDay = null;
    res.startMonth = null;
    res.startYear = null;
  }

  if (!isNaN(endDateObj.getTime())) {
    res.approximateEndTime = approximateEndTime;
    res.approximateEndTime_zone = approximateEndTime_zone;
    res.approximateEndTime_utc = zonedTimeToUtc(
      endDateObj,
      approximateEndTime_zone,
    );
    res.endDay = res.approximateEndTime_utc.getDate();
    res.endMonth = res.approximateEndTime_utc.getMonth() + 1;
    res.endYear = res.approximateEndTime_utc.getFullYear();
  } else {
    res.approximateEndTime = null;
    res.approximateEndTime_zone = null;
    res.approximateEndTime_utc = null;
    res.endDay = null;
    res.endMonth = null;
    res.endYear = null;
  }

  res.name = name;
  res.externalUrl = externalUrl;
  res.externalUrl = externalUrl;
  if (lon && lat) {
    res.location = {
      crs: {
        type: 'name',
        properties: { name: 'EPSG:4326' },
      },
      type: 'Point',
      coordinates: [lon, lat],
    };
  }
  res.locationName = locationName;
  res.isPrivate = isPrivate;
  res.isOpen = isOpen;
  res.source = source;
  res.ics = ics;
  res.isPubliclyViewable = isPubliclyViewable;
  res.description = description;
  if (country && city) {
    res.country = country;
    res.city = city;
  } else {
    // fetch closest
    res.country = findClosestCountry([lon, lat]);
    res.city = findClosestCity([lon, lat]);
  }

  res.editors = dataAuth.isOwner
    ? [{ id: user.id }, ...editors.filter((editor) => editor.id !== user.id)]
    : res.editors;

  res = setUpdateMeta(res, user);

  const result = await dataAccess.upsert(id, res);

  if (lon && lat) {
    setImmediate(async () => {
      exports.generateOpenGraph(result.id, [lon, lat]);
    });
  }

  return result;
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

exports.delete = async (id, user) => {
  let result = await dataAccess.getById(id);

  if (!result)
    throw new ServiceError(
      'Not Found',
      statusCodes.NOT_FOUND,
      errorCodes.DATA_NOT_FOUND,
    );

  const dataAuth = validateSqlDataAuth(result, user.id);

  if (!dataAuth.isOwner)
    throw new ServiceError(
      'Unauthorized',
      statusCodes.UNAUTHORIZED,
      errorCodes.UNAUTHORIZED_DATA_CHANGE,
    );

  await dataAccess.delete(id);

  return result;
};

const uuid = require('uuid');
const { zonedTimeToUtc } = require('date-fns-tz');
const dataAccess = require('../../syrf-schema/dataAccess/v1/calendarEvent');
const { errorCodes } = require('../../syrf-schema/enums');
const {
  setCreateMeta,
  setUpdateMeta,
} = require('../../syrf-schema/utils/utils');
const { pointToCity, pointToCountry } = require('../../utils/gisUtils');

const { createMapScreenshot } = require('../../utils/createMapScreenshot');
const { uploadMapScreenshot } = require('../../services/s3Util');
const db = require('../../syrf-schema');

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

  if (id && !res) {
    throw new Error(`Calendar Event ${id} Not Found`);
  }

  if (isNew) {
    res = setCreateMeta(res, user);
  }

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
    res.country = pointToCountry([lon, lat]);
    res.city = pointToCity([lon, lat]);
  }

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

  if (!result) {
    throw new Error('Calendar event not found');
  }

  return result;
};

exports.delete = async (id, user) => {
  let result = await dataAccess.getById(id);

  if (!result) {
    throw new Error('Calendar event not found');
  }

  await dataAccess.delete(id);

  return result;
};

exports.generateOpenGraph = async (id, position) => {
  try {
    const imageBuffer = await createMapScreenshot(position);
    const response = await uploadMapScreenshot(
      imageBuffer,
      `calendar-event/${id}/${uuid.v4()}.png`,
    );
    await dataAccess.addOpenGraph(id, response.Location);
  } catch (error) {
    console.error(
      `Failed to create mapshot for calendar event: ${id}. Error: ${error.message}`,
    );
  }
};
exports.addOpenGraph = async (id, openGraphImage) => {
  await db.CalenderEvent.update(
    { openGraphImage },
    {
      where: {
        id,
      },
    },
  );
};

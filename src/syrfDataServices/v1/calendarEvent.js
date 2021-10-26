const uuid = require('uuid');
const ical = require('ical-generator');
const { zonedTimeToUtc } = require('date-fns-tz');
const dataAccess = require('../../syrf-schema/dataAccess/v1/calendarEvent');
const { pointToCity, pointToCountry } = require('../../utils/gisUtils');

const { createMapScreenshot } = require('../../utils/createMapScreenshot');
const { uploadMapScreenshot } = require('../../services/s3Util');
const db = require('../../syrf-schema');

exports.upsert = async (
  {
    id,
    name,
    externalUrl,
    approximateStartTime,
    approximateStartTime_zone = 'Etc/UTC',
    lat,
    lon,
    locationName,
    approximateEndTime,
    approximateEndTime_zone = 'Etc/UTC',
    description,
    country,
    city,
    source,
  },
  transaction,
) => {
  const now = Date.now();
  const eventToSave = {
    name,
    externalUrl,
    locationName,
    isPrivate: false,
    isOpen: false,
    description,
    country: country || pointToCountry([lon, lat]),
    city: city || pointToCity([lon, lat]),
    source,
    createdAt: now,
    updatedAt: now,
  };

  const startDateObj = new Date(approximateStartTime);
  const endDateObj = new Date(approximateEndTime);

  if (!isNaN(startDateObj.getTime())) {
    eventToSave.approximateStartTime = approximateStartTime;
    eventToSave.approximateStartTime_zone = approximateStartTime_zone;
    eventToSave.approximateStartTime_utc = zonedTimeToUtc(
      startDateObj,
      approximateStartTime_zone,
    );
    eventToSave.startDay = eventToSave.approximateStartTime_utc.getDate();
    eventToSave.startMonth =
      eventToSave.approximateStartTime_utc.getMonth() + 1;
    eventToSave.startYear = eventToSave.approximateStartTime_utc.getFullYear();
  } else {
    eventToSave.approximateStartTime = null;
    eventToSave.startDay = null;
    eventToSave.startMonth = null;
    eventToSave.startYear = null;
  }

  if (!isNaN(endDateObj.getTime())) {
    eventToSave.approximateEndTime = approximateEndTime;
    eventToSave.approximateEndTime_zone = approximateEndTime_zone;
    eventToSave.approximateEndTime_utc = zonedTimeToUtc(
      endDateObj,
      approximateEndTime_zone,
    );
    eventToSave.endDay = eventToSave.approximateEndTime_utc.getDate();
    eventToSave.endMonth = eventToSave.approximateEndTime_utc.getMonth() + 1;
    eventToSave.endYear = eventToSave.approximateEndTime_utc.getFullYear();
  } else {
    eventToSave.approximateEndTime = null;
    eventToSave.approximateEndTime_zone = null;
    eventToSave.approximateEndTime_utc = null;
    eventToSave.endDay = null;
    eventToSave.endMonth = null;
    eventToSave.endYear = null;
  }

  if (lon && lat) {
    eventToSave.location = {
      crs: {
        type: 'name',
        properties: { name: 'EPSG:4326' },
      },
      type: 'Point',
      coordinates: [lon, lat],
    };
  }

  eventToSave.ics = createICal(eventToSave);

  const result = await dataAccess.upsert(id, eventToSave, transaction);

  if (lon && lat) {
    setImmediate(async () => {
      exports.generateOpenGraph(result.id, [lon, lat]);
    });
  }
  return result;
};

exports.generateOpenGraph = async (id, position, transaction) => {
  try {
    const imageBuffer = await createMapScreenshot(position);
    const response = await uploadMapScreenshot(
      imageBuffer,
      `calendar-event/${id}/${uuid.v4()}.png`,
    );
    await dataAccess.addOpenGraph(id, response.Location, transaction);
  } catch (error) {
    console.error(
      `Failed to create mapshot for calendar event: ${id}. Error: ${error.message}`,
    );
  }
};

exports.addOpenGraph = async (id, openGraphImage, transaction) => {
  await db.CalenderEvent.update(
    { openGraphImage },
    {
      where: {
        id,
      },
      transaction,
    },
  );
};

const createICal = ({
  name,
  description,
  locationName,
  city,
  country,
  externalUrl,
  approximateStartTime_utc,
  approximateEndTime_utc,
}) => {
  if (!approximateStartTime_utc) {
    return null;
  }
  const calendar = ical({ name });
  calendar.createEvent({
    start: approximateStartTime_utc,
    end: approximateEndTime_utc,
    summary: name,
    description: description,
    location: locationName || [city, country].filter(Boolean).join(', '),
    url: externalUrl,
  });
  return calendar.toString();
};

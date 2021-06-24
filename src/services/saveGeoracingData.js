const { v4: uuidv4 } = require('uuid');

const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');

const saveGeoracingData = async (data) => {
  const transaction = await db.sequelize.transaction();
  let errorMessage = '';
  let raceUrl = [];

  try {
    if (data.GeoracingRace) {
      // TODO: Are we going to accept array of race here, or will we be accepting one race per each file
      // Most of the scrapers are currently accepting arrays of race, will update to single object if only one race at a time
      // For better checking
      raceUrl = data.GeoracingRace.map((row) => {
        return { original_id: row.original_id, url: row.url };
      });
      await db.georacingRace.bulkCreate(data.GeoracingRace, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.GeoracingEvent) {
      await db.georacingEvent.bulkCreate(data.GeoracingEvent, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.GeoracingActor) {
      await db.georacingActor.bulkCreate(data.GeoracingActor, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.GeoracingWeather) {
      await db.georacingWeather.bulkCreate(data.GeoracingWeather, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.GeoracingCourse) {
      await db.georacingCourse.bulkCreate(data.GeoracingCourse, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.GeoracingCourseObject) {
      await db.georacingCourseObject.bulkCreate(data.GeoracingCourseObject, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.GeoracingCourseElement) {
      await db.georacingCourseElement.bulkCreate(data.GeoracingCourseElement, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.GeoracingGroundPlace) {
      await db.georacingGroundPlace.bulkCreate(data.GeoracingGroundPlace, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.GeoracingPosition) {
      await db.georacingPosition.bulkCreate(data.GeoracingPosition, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.GeoracingLine) {
      await db.georacingLine.bulkCreate(data.GeoracingLine, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.GeoracingSplittime) {
      await db.georacingSplittime.bulkCreate(data.GeoracingSplittime, {
        ignoreDuplicates: true,
        validate: true,
      });
    }
    if (data.GeoracingSplittimeObject) {
      await db.georacingSplittimeObject.bulkCreate(
        data.GeoracingSplittimeObject,
        {
          ignoreDuplicates: true,
          validate: true,
        },
      );
    }
  } catch (error) {
    await transaction.rollback();
    errorMessage = databaseErrorHandler(error);
  }

  if (raceUrl.length > 0) {
    if (errorMessage) {
      // TODO: Should we make unique index on url of success and fail?
      // Right now, if we do this way, it will add non-unique url if endpoint is hit multiple times
      // Won't be a problem if apiclient will not retry
      await db.georacingFailedUrl.bulkCreate(
        raceUrl.map((row) => {
          const { url } = row;
          return {
            id: uuidv4(),
            url,
            error: errorMessage,
          };
        }),
        {
          ignoreDuplicates: true,
          validate: true,
        },
      );
    } else {
      await db.georacingSuccessfulUrl.bulkCreate(
        raceUrl.map((row) => {
          const { url, original_id } = row;
          return {
            id: uuidv4(),
            url,
            original_id,
          };
        }),
        {
          ignoreDuplicates: true,
          validate: true,
        },
      );
    }
  }
  return errorMessage;
};

module.exports = saveGeoracingData;

const uuid = require('uuid');
const dataAccess = require('../../syrf-schema/dataAccess/v1/course');
const competitionUnitDataAccess = require('../../syrf-schema/dataAccess/v1/competitionUnit');
const eventDAL = require('../../syrf-schema/dataAccess/v1/calendarEvent');
const { errorCodes } = require('../../syrf-schema/enums');
const {
  setUpdateMeta,
  setCreateMeta,
  ValidationError,
  ServiceError,
  statusCodes,
  useTransaction,
  validateSqlDataAuth,
  getCourseCenterPoint,
} = require('../../syrf-schema/utils/utils');

const {
  findClosestCity,
  findClosestCountry,
} = require('../../utils/closestLocation');
const { createMapScreenshot } = require('../../utils/createMapScreenshot');
const { uploadMapScreenshot } = require('../../externalServices/s3Bucket');
const {
  competitionUnitSync,
} = require('../../services/v1/elasticSearchDataSync');

const setGeometryId = (geometries) => {
  if (Array.isArray(geometries)) {
    return geometries.map((t) => ({
      ...t,
      id: uuid.v4(),
      points: t.coordinates,
      coordinates: t.coordinates.map((coordinate) =>
        Array.isArray(coordinate)
          ? coordinate
          : typeof coordinate === 'object'
          ? coordinate.position
          : null,
      ),
    }));
  } else {
    return geometries;
  }
};
exports.setGeometryId = setGeometryId;

const updatePoints = async (newGeometries, oldGeometries = [], transaction) => {
  if (!Array.isArray(newGeometries)) return null;
  await dataAccess.clearPoints(
    oldGeometries?.map((t) => t?.id) || [],
    transaction,
  );

  let newPoints = [];

  newGeometries.forEach((geometry) => {
    if (!Array.isArray(geometry.points)) return;

    geometry.points.forEach((coordinate, order) => {
      if (Array.isArray(coordinate)) {
        newPoints.push({
          id: uuid.v4(),
          geometryId: geometry.id,
          position: {
            type: 'Point',
            coordinates: [coordinate[0], coordinate[1]],
          },
          order,
          properties: null,
          markTrackerId: null,
        });
      } else if (typeof coordinate === 'object') {
        newPoints.push({
          id: uuid.v4(),
          geometryId: geometry.id,
          position: {
            type: 'Point',
            coordinates: [coordinate.position[0], coordinate.position[1]],
          },
          order,
          properties: coordinate.properties,
          markTrackerId: coordinate.markTrackerId,
        });
      }
    });
  });

  return await dataAccess.bulkInsertPoints(newPoints, transaction);
};
exports.updatePoints = updatePoints;

exports.generateOGImage = async (idList, centerPoint) => {
  let openGraphImage = null;
  try {
    const imageBuffer = await createMapScreenshot(centerPoint);
    const response = await uploadMapScreenshot(
      imageBuffer,
      `competition/${uuid.v4()}.png`,
    );
    openGraphImage = response.Location;
    await competitionUnitDataAccess.addOpenGraphImage(idList, {
      openGraphImage,
    });
  } catch (error) {
    console.error(
      `Failed to create mapshot for competition: ${idList.join(', ')}`,
    );
  }
};

exports.upsert = useTransaction(
  async (
    id,
    {
      competitionUnitId = null,
      courseSequencedGeometries,
      courseUnsequencedUntimedGeometry,
      courseUnsequencedTimedGeometry,
      calendarEventId,
      name,
    } = {},
    user,
    transaction,
  ) => {
    const isNew = !id;
    let res = await dataAccess.getById(id);
    let oldData = { ...res };

    if (id && !res)
      throw new ValidationError('Not Found', null, statusCodes.NOT_FOUND);

    let eventData = {};
    if (isNew) {
      res = {};
      if (calendarEventId) {
        eventData = await eventDAL.getById(calendarEventId);
      }
      res = setCreateMeta(res, user);
    }

    if (calendarEventId) {
      const dataAuth = validateSqlDataAuth(
        {
          editors: eventData.editors,
          ownerId: eventData.owner.id,
        },
        user.id,
      );
      if (!dataAuth.isEditor && !dataAuth.isOwner)
        throw new ServiceError(
          'Unauthorized',
          statusCodes.UNAUTHORIZED,
          errorCodes.UNAUTHORIZED_DATA_CHANGE,
        );
    }

    res.competitionUnitId = competitionUnitId;
    res.courseSequencedGeometries = setGeometryId(courseSequencedGeometries);
    res.courseUnsequencedUntimedGeometry = setGeometryId(
      courseUnsequencedUntimedGeometry,
    );
    res.courseUnsequencedTimedGeometry = setGeometryId(
      courseUnsequencedTimedGeometry,
    );

    res.calendarEventId = calendarEventId;
    res.name = name;

    res = setUpdateMeta(res, user);

    let [result] = await Promise.all([
      dataAccess.upsert(id, res, transaction),
      updatePoints(
        res.courseSequencedGeometries,
        oldData.courseSequencedGeometries,
        transaction,
      ),
      updatePoints(
        res.courseUnsequencedUntimedGeometry,
        oldData.courseUnsequencedUntimedGeometry,
        transaction,
      ),
      updatePoints(
        res.courseUnsequencedTimedGeometry,
        oldData.courseUnsequencedTimedGeometry,
        transaction,
      ),
    ]);

    // Country and city directly derived on request
    const relatedCompetitions = await dataAccess.getCourseCompetitionIds(
      result.id,
    );

    let centerPoint = getCourseCenterPoint(courseSequencedGeometries);

    // Trigger metadata generation
    if (centerPoint !== null) {
      setImmediate(async () => {
        try {
          await exports.generateOGImage(relatedCompetitions, centerPoint);
        } catch (err) {
          console.log(err.message);
        }
      });

      const country = findClosestCountry(centerPoint);
      const city = findClosestCity(centerPoint);

      await competitionUnitDataAccess.updateCountryCity(relatedCompetitions, {
        country,
        city,
        centerPoint,
      });
    } else {
      await competitionUnitDataAccess.updateCountryCity(
        relatedCompetitions,
        null,
      );
    }

    relatedCompetitions.forEach((competitionUnitId) => {
      competitionUnitSync(competitionUnitId);
    });

    return result;
  },
);

exports.getAll = async (paging, calendarEventId) => {
  return await dataAccess.getAll(paging, calendarEventId);
};

exports.getById = async (id, calendarEventId) => {
  let result = await dataAccess.getById(id);

  if (!result)
    throw new ValidationError(
      'Not Found',
      null,
      statusCodes.NOT_FOUND,
      errorCodes.DATA_NOT_FOUND,
    );
  if (calendarEventId && result.calendarEventId !== calendarEventId)
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

exports.delete = useTransaction(async (id, calendarEventId, transaction) => {
  let result = await dataAccess.getById(id, transaction);

  if (!result)
    throw new ValidationError(
      'Not Found',
      null,
      statusCodes.NOT_FOUND,
      errorCodes.DATA_NOT_FOUND,
    );
  if (calendarEventId && result.calendarEventId !== calendarEventId)
    throw new ValidationError(
      'Not Found',
      null,
      statusCodes.NOT_FOUND,
      errorCodes.DATA_NOT_FOUND,
    );

  const dataAuth = validateSqlDataAuth(
    {
      editors: result.calendarEvent.editors,
      ownerId: result.calendarEvent.owner.id,
    },
    user.id,
  );

  if (!dataAuth.isOwner)
    throw new ServiceError(
      'Unauthorized',
      statusCodes.UNAUTHORIZED,
      errorCodes.UNAUTHORIZED_DATA_CHANGE,
    );

  await Promise.all([
    dataAccess.clearPoints(
      [
        ...result.courseSequencedGeometries,
        ...result.courseUnsequencedUntimedGeometry,
        ...result.courseUnsequencedTimedGeometry,
      ].map((t) => t?.id) || [],
      transaction,
    ),
    dataAccess.delete(id, transaction),
  ]);

  return result;
});

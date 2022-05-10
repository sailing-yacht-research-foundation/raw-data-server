const uuid = require('uuid');
const dataAccess = require('../../syrf-schema/dataAccess/v1/course');
const competitionUnitDataAccess = require('../../syrf-schema/dataAccess/v1/competitionUnit');
const { createMapScreenshot } = require('../../utils/createMapScreenshot');
const { uploadMapScreenshot } = require('../../utils/s3Util');

const setGeometryId = (geometries) => {
  if (Array.isArray(geometries)) {
    return geometries.map((t) => {
      return {
        ...t,
        id: t.id || uuid.v4(),
        points: t.coordinates,
        coordinates: t.coordinates.map((coordinate) =>
          Array.isArray(coordinate)
            ? coordinate
            : typeof coordinate === 'object'
            ? coordinate.position
            : null,
        ),
      };
    });
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
      `competition/${uuid.v4()}.jpg`,
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

exports.upsert = async (
  id,
  {
    competitionUnitId = null,
    courseSequencedGeometries,
    courseUnsequencedUntimedGeometry,
    courseUnsequencedTimedGeometry,
    calendarEventId,
    name,
  } = {},
  transaction,
) => {
  const now = Date.now();
  const courseToSave = {
    name,
    competitionUnitId,
    calendarEventId,
    createdAt: now,
    updatedAt: now,
  };

  courseToSave.courseSequencedGeometries = setGeometryId(
    courseSequencedGeometries,
  );
  courseToSave.courseUnsequencedUntimedGeometry = setGeometryId(
    courseUnsequencedUntimedGeometry,
  );
  courseToSave.courseUnsequencedTimedGeometry = setGeometryId(
    courseUnsequencedTimedGeometry,
  );
  const [result, courseSequencedGeometriesPoints] = await Promise.all([
    dataAccess.upsert(id, courseToSave, transaction),
    updatePoints(
      courseToSave.courseSequencedGeometries,
      null, // old geometries. Since this is scraped data only create no update
      transaction,
    ),
    updatePoints(
      courseToSave.courseUnsequencedUntimedGeometry,
      null,
      transaction,
    ),
    updatePoints(
      courseToSave.courseUnsequencedTimedGeometry,
      null,
      transaction,
    ),
  ]);
  return [result, courseSequencedGeometriesPoints];
};

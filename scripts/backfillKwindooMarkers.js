require('dotenv').config();
const db = require('../src/models');
const { createGeometryPoint } = require('../src/utils/gisUtils');
const courses = require('../src/syrfDataServices/v1/courses');
const competitionUnitDAL = require('../src/syrf-schema/dataAccess/v1/competitionUnit');
const courseGeometriesDAL = require('../src/syrf-schema/dataAccess/v1/courseGeometries');
const syrfDb = require('../src/syrf-schema/index');

/**
 * This script creates CourseSequencedGeometries in syrf main DB from scraper DB KwindooMarkers
 */
(async () => {
  const limit = 10;
  let page = 0;

  let shouldContinue = true;
  while (shouldContinue) {
    const markersToAdd = await db.sequelize.query(
      `
      SELECT * FROM "KwindooMarkers" m
      WHERE original_id NOT IN (
        SELECT DISTINCT primary_marker_id FROM "KwindooWaypoints" WHERE race = m.race
        UNION ALL
        SELECT DISTINCT secondary_marker_id FROM "KwindooWaypoints" WHERE race = m.race
      ) ORDER BY race OFFSET ${page * limit} LIMIT ${limit}
    `,
      { type: db.sequelize.QueryTypes.SELECT },
    );
    console.log(markersToAdd);
    if (markersToAdd.length === 0) {
      shouldContinue = false;
      break;
    }

    for (const marker of markersToAdd) {
      try {
        console.log(`Processing marker ${marker.id}`);
        const competitionUnit = await competitionUnitDAL.getById(
          marker.race,
          false,
        );
        if (!competitionUnit?.courseId) {
          console.log('Race not found. Skipping');
          continue;
        }
        const existingGeometries =
          await courseGeometriesDAL.getSequencedByCourseId(
            competitionUnit.courseId,
          );

        // In kwindoo, usually the geometry order starts at 0 and the finish line have order of 10000 . If geometry length is >= 2 then it means it has a finish line.
        // If it only has 0 or 1 geometry, it means there is no finish line yet so the next geometry will be added with 0 or 1 order
        // Eg. Only startline added, length = 1. The startline order is 0 then the next geometry will have order of 1.
        let markerOrder =
          existingGeometries.length >= 2
            ? existingGeometries.length - 1
            : existingGeometries.length; // exclude finish line

        const geometryMark = createGeometryPoint({
          lat: marker.lat,
          lon: marker.lon,
          properties: {
            name: marker.name,
            approach_radius: marker.approach_radius,
            marker_id: marker.original_id,
          },
        });

        const now = Date.now();
        const sequencedGeometries = courses.setGeometryId([
          {
            id: marker.id,
            ...geometryMark,
            order: markerOrder,
            courseId: competitionUnit.courseId,
            createdAt: now,
            updatedAt: now,
          },
        ]);
        const transaction = await syrfDb.sequelize.transaction();
        try {
          console.log('Saving sequenced geometry', sequencedGeometries);
          await syrfDb.CourseSequencedGeometry.create(sequencedGeometries[0], {
            transaction,
          });

          console.log('Saving geometry points');
          await courses.updatePoints(sequencedGeometries, null, transaction);

          await transaction.commit();
          console.log('Finished saving geometry');
        } catch (err) {
          await transaction.rollback();
          console.log(`Error saving marker ${marker.id} to database`, err);
        }
      } catch (err) {
        console.log(`Error processing marker ${marker.id}`, err);
      }
    }

    page++;
  }
  console.log('Finished saving all missing Kwindoo Makers to main db');
})();

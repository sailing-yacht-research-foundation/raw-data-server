const dataAccess = require('../../syrf-schema/dataAccess/v1/courseGeometries');
const courseDAL = require('../../syrf-schema/dataAccess/v1/course');
const courseSVC = require('./courses');
const { useTransaction } = require('../../syrf-schema/utils/utils');

exports.setSequenced = useTransaction(
  async (courseId, geometries = [], transaction) => {
    const oldGeometries = await dataAccess.getSequencedByCourseId(
      courseId,
      transaction,
    );

    geometries = courseSVC.setGeometryId(geometries);

    await Promise.all([
      dataAccess.setSequencedGeometries(courseId, geometries, transaction),
      courseSVC.updatePoints(geometries, oldGeometries, transaction),
    ]);

    return geometries;
  },
);

exports.setUnsequenced = useTransaction(
  async (courseId, geometries = [], transaction) => {
    const oldGeometries = await dataAccess.getUnsequencedByCourseId(
      courseId,
      transaction,
    );

    geometries = courseSVC.setGeometryId(geometries);

    await Promise.all([
      dataAccess.setUnsequencedGeometries(courseId, geometries, transaction),
      courseSVC.updatePoints(geometries, oldGeometries, transaction),
    ]);

    return geometries;
  },
);

exports.setTimed = useTransaction(
  async (courseId, geometries = [], transaction) => {
    const oldGeometries = await dataAccess.getTimedByCourseId(
      courseId,
      transaction,
    );

    geometries = courseSVC.setGeometryId(geometries);

    await Promise.all([
      dataAccess.setTimedGeometries(courseId, geometries, transaction),
      courseSVC.updatePoints(geometries, oldGeometries, transaction),
    ]);

    return geometries;
  },
);

exports.getSequencedByCourseId = async (courseId) => {
  return await dataAccess.getSequencedByCourseId(courseId);
};

exports.getUnsequencedByCourseId = async (courseId) => {
  return await dataAccess.getUnsequencedByCourseId(courseId);
};

exports.getTimedByCourseId = async (courseId) => {
  return await dataAccess.getTimedByCourseId(courseId);
};

exports.clearSequenced = useTransaction(async (courseId) => {
  const oldGeometries = await dataAccess.getSequencedByCourseId(courseId);

  let [result] = await Promise.all([
    dataAccess.clearSequenced(courseId),
    courseDAL.clearPoints(oldGeometries?.map((t) => t.id)),
  ]);

  return {
    deletedRowCount: result || 0,
  };
});

exports.clearUnsequenced = useTransaction(async (courseId, transaction) => {
  const oldGeometries = await dataAccess.getUnsequencedByCourseId(
    courseId,
    transaction,
  );

  let [result] = await Promise.all([
    dataAccess.clearUnsequenced(courseId, transaction),
    courseDAL.clearPoints(
      oldGeometries?.map((t) => t.id),
      transaction,
    ),
  ]);

  return {
    deletedRowCount: result || 0,
  };
});

exports.clearTimed = useTransaction(async (courseId, transaction) => {
  const oldGeometries = await dataAccess.getTimedByCourseId(
    courseId,
    transaction,
  );

  let [result] = await Promise.all([
    dataAccess.clearTimed(courseId, transaction),
    courseDAL.clearPoints(
      oldGeometries?.map((t) => t.id),
      transaction,
    ),
  ]);

  return {
    deletedRowCount: result || 0,
  };
});

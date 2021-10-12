const uuid = require('uuid');
const db = require('../../syrf-schema');
const { includeMeta } = require('../../utils/utils');

const include = [
  {
    as: 'calendarEvent',
    model: db.CalenderEvent,
    attributes: ['id', 'name', 'isPrivate'],
  },
  {
    as: 'vesselParticipantGroup',
    model: db.VesselParticipantGroup,
    attributes: ['id', 'vesselParticipantGroupId'],
  },
  ...includeMeta,
];

exports.upsert = async (id, data = {}) => {
  if (!id) id = uuid.v4();

  const [result] = await db.CompetitionUnit.upsert({
    ...data,
    id,
  });

  return result?.toJSON();
};

exports.getAll = async (paging, calendarEventId) => {
  let where = {};
  if (paging.query) {
    where.name = {
      [db.Op.like]: `%${paging.query}%`,
    };
  }

  if (calendarEventId) where.calendarEventId = calendarEventId;

  const result = await db.CompetitionUnit.findAllWithPaging(
    {
      where,
      include: [
        {
          as: 'calendarEvent',
          model: db.CalenderEvent,
          attributes: ['id', 'name', 'isPrivate'],
        },
      ],
    },
    paging,
  );
  return result;
};

exports.getById = async (id) => {
  const result = await db.CompetitionUnit.findByPk(id, {
    include,
  });

  return result?.toJSON();
};

exports.delete = async (id) => {
  const data = await db.CompetitionUnit.findByPk(id, {
    include,
  });

  if (data) {
    await db.CompetitionUnit.destroy({
      where: {
        id: id,
      },
    });
  }

  return data?.toJSON();
};

exports.setEnd = async (id) => {
  const result = await db.CompetitionUnit.update(
    {
      endTime: new Date(),
      isCompleted: true,
    },
    {
      where: {
        id,
      },
    },
  );

  return result[0];
};

exports.updateCourse = async (id, courseId) => {
  const result = await db.CompetitionUnit.update(
    {
      courseId: courseId,
    },
    {
      where: {
        id,
      },
    },
  );
  return result[0];
};

const dataAccess = require('../../syrf-schema/dataAccess/v1/vessel');
const db = require('../../syrf-schema');

exports.upsert = async (
  id,
  {
    publicName,
    vesselId,
    globalId,
    lengthInMeters,
    widthInMeters,
    draftInMeters,
    model,
    handicap,
    orcJsonPolars,
    scope,
    source,
  } = {},
  transaction,
) => {
  const now = Date.now();
  const vesselToSave = {
    publicName,
    vesselId,
    globalId,
    lengthInMeters,
    widthInMeters,
    draftInMeters,
    model,
    handicap,
    orcJsonPolars,
    scope,
    source,
    bulkCreated: true,
    createdAt: now,
    updatedAt: now,
  };

  return await dataAccess.upsert(id, vesselToSave, transaction);
};

exports.createVesselObject = ({ id, name, vesselId, lengthInMeters } = {}) => {
  return { id, name, vesselId, lengthInMeters };
};

exports.getExistingVesselsByScrapedUrl = async (externalUrl) => {
  externalUrl = externalUrl.split('?')[0];
  const existingCalendarEvent = await db.CalendarEvent.findOne({
    where: {
      externalUrl: {
        [db.Op.like]: `${externalUrl}%`,
      },
    },
    include: [
      {
        as: 'competitionUnit',
        model: db.CompetitionUnit,
        attributes: ['id', 'vesselParticipantGroupId'],
        include: [
          {
            as: 'vesselParticipantGroup',
            model: db.VesselParticipantGroup,
            attributes: ['id'],
            include: [
              {
                as: 'vesselParticipants',
                model: db.VesselParticipant,
                include: [
                  {
                    as: 'vessel',
                    model: db.Vessel,
                  },
                ],
                attributes: ['id', 'vesselId'],
              },
            ],
          },
        ],
      },
    ],
  });

  // in case there is no existing calendar event, so just return null
  if (!existingCalendarEvent) {
    return [];
  }

  const vesselParticipantIds = [];
  for (const currentCompetitionUnit of existingCalendarEvent.competitionUnit) {
    if (!currentCompetitionUnit.vesselParticipantGroup.vesselParticipants) {
      continue;
    }

    const vesselParticipants =
      currentCompetitionUnit.vesselParticipantGroup.vesselParticipants;
    for (const vesselParticipant of vesselParticipants) {
      vesselParticipantIds.push(vesselParticipant.id);
    }
  }

  const allVessels = await db.VesselParticipant.findAll({
    where: {
      id: { [db.Op.in]: vesselParticipantIds },
    },
    include: [
      {
        as: 'vessel',
        model: db.Vessel,
      },
    ],
  });
  return allVessels.map((t) => t.vessel);
};

exports.getByVesselIdAndSource = async (vesselId, source) => {
  return await dataAccess.getByVesselIdAndSource(vesselId, source);
};

exports.getExistingVesselByCalendarEvent = async (calendarEventId) => {
  return await dataAccess.getExistingVesselByCalendarEvent(calendarEventId);
};

exports.bulkCreate = async (data, transaction) => {
  return await dataAccess.bulkCreate(data, transaction);
};

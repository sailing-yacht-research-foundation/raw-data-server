const dataAccess = require('../../syrf-schema/dataAccess/v1/vessel');
const db = require('../../syrf-schema');

exports.upsert = async (
  {
    id,
    publicName,
    vesselId,
    globalId,
    lengthInMeters,
    orcJsonPolars,
    scope,
  } = {},
  transaction,
) => {
  const now = Date.now();
  const vesselToSave = {
    publicName,
    vesselId,
    globalId,
    lengthInMeters,
    orcJsonPolars,
    scope,
    bulkCreated: false,
    createdAt: now,
    updatedAt: now,
  };

  return await dataAccess.upsert(id, vesselToSave, transaction);
};

exports.getExistingVesselsByScrapedUrl = async (externalUrl) => {
  externalUrl = externalUrl.split('?')[0];
  const existingCalendarEvent = await db.CalenderEvent.findOne({
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
                    attributes: [
                      'id',
                      'vesselId',
                      'publicName',
                      'orcJsonPolars',
                      'globalId',
                      'publicName',
                    ],
                  },
                ],
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

  const results = [];

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

  // TODO: check why it can't join vessels
  return results;
};

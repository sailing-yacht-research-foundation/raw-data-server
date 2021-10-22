const dataAccess = require('../../syrf-schema/dataAccess/v1/vessel');
const { errorCodes } = require('../../syrf-schema/enums');
const {
  setUpdateMeta,
  setCreateMeta,
  ServiceError,
  statusCodes,
} = require('../../syrf-schema/utils/utils');
const db = require('../../syrf-schema');

exports.upsert = async (
  id,
  {
    publicName,
    vesselId,
    globalId,
    lengthInMeters,
    orcJsonPolars,
    scope,
    bulkCreated = false,
  } = {},
  user,
  transaction,
) => {
  const isNew = !id;

  let res = isNew ? null : await dataAccess.getById(id);

  if (id && !res)
    throw new ServiceError(
      'Not Found',
      statusCodes.NOT_FOUND,
      errorCodes.DATA_NOT_FOUND,
    );

  if (isNew) {
    res = {};
    res = setCreateMeta(res, user);
  }

  res.publicName = publicName;
  res.vesselId = vesselId;
  res.globalId = globalId;
  res.lengthInMeters = lengthInMeters;
  res.orcJsonPolars = orcJsonPolars;
  res.scope = scope;
  res.bulkCreated = bulkCreated;

  res = setUpdateMeta(res, user);

  return await dataAccess.upsert(id, res, transaction);
};

exports.getAll = async (paging) => {
  return await dataAccess.getAll(paging);
};

exports.getById = async (id) => {
  let result = await dataAccess.getById(id);

  if (!result)
    throw new ServiceError(
      'Not Found',
      statusCodes.NOT_FOUND,
      errorCodes.DATA_NOT_FOUND,
    );

  return result;
};

exports.delete = async (id) => {
  let result = await dataAccess.delete(id);

  if (!result)
    throw new ServiceError(
      'Not Found',
      statusCodes.NOT_FOUND,
      errorCodes.DATA_NOT_FOUND,
    );

  return result;
};

exports.getAllForEvent = async (userId, eventId, paging) => {
  return await dataAccess.getAllForEvent(userId, eventId, paging);
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

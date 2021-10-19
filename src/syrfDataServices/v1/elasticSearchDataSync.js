const dataAccess = require('./searchDataSync');
const cuDAL = require('../../syrf-schema/dataAccess/v1/competitionUnit');
const vpDAL = require('../../syrf-schema/dataAccess/v1/vesselParticipant');
const ceDAL = require('../../syrf-schema/dataAccess/v1/calendarEvent');
const { searchDataSourceName } = require('../../syrf-schema/enums');
const { ServiceError } = require('../../syrf-schema/utils/utils');

const prepareCompetitionUnitData = async (id) => {
  const competitionUnit = await cuDAL.getById(id);

  if (!competitionUnit) throw new ServiceError('Competition not found');

  const [vesselParticipants, calendarEvent] = await Promise.all([
    vpDAL.getAllByVpg(competitionUnit?.vesselParticipantGroupId),
    ceDAL.getById(competitionUnit?.calendarEventId),
  ]);

  if (calendarEvent.isPrivate) return null;

  const searchData = {};

  searchData.id = id;
  searchData.name = competitionUnit.name;
  searchData.event = competitionUnit.calendarEventId;
  searchData.event_description = calendarEvent?.description;
  searchData.event_name = calendarEvent?.name;
  searchData.description = competitionUnit.description;

  searchData.approx_start_point = competitionUnit.approximateStartLocation;
  searchData.approx_end_point = competitionUnit.approximateEndLocation;

  searchData.source = searchDataSourceName;
  searchData.start_country = competitionUnit.country;
  searchData.start_city = competitionUnit.city;
  searchData.open_graph_image = competitionUnit.openGraphImage;
  searchData.start_year = competitionUnit.approximateStart.getFullYear();
  searchData.start_month = competitionUnit.approximateStart.getMonth() + 1;
  searchData.start_day = competitionUnit.approximateStart.getDate();
  searchData.approx_start_time_ms = competitionUnit.approximateStart.getTime();
  searchData.bounding_box = competitionUnit.boundingBox;
  searchData.num_boats = vesselParticipants?.length || 0;
  searchData.boat_names = vesselParticipants?.map((vp) =>
    vp?.vessel?.publicName ? vp?.vessel?.publicName : vp?.id,
  );

  return searchData;
};
exports.prepareCompetitionUnitData = prepareCompetitionUnitData;
exports.competitionUnitSync = async (id, isDelete = false) => {
  console.log('elasticsearch competition unit sync started : ', id, isDelete);
  if (!id) {
    console.log('elasticsearch competition unit sync failed : empty ID');
    return;
  }

  setImmediate(async () => {
    try {
      if (isDelete) {
        await dataAccess.competitionUnitDelete(id);
        return;
      }
      const searchData = await prepareCompetitionUnitData(id);

      if (!searchData) return;

      await dataAccess.competitionUnitPush(id, searchData);
    } catch (error) {
      console.log(
        'elasticsearch competition unit sync failed : ',
        error.message,
      );
    }
  });
};

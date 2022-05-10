const { competitionUnitStatus } = require('../syrf-schema/enums');

function getUnfinishedRaceStatus(raceStartDate) {
  raceStartDate.setUTCHours(0, 0, 0, 0);
  const todaysDate = new Date();
  todaysDate.setUTCHours(0, 0, 0, 0);
  return raceStartDate <= todaysDate
    ? competitionUnitStatus.ONGOING
    : competitionUnitStatus.SCHEDULED;
}

module.exports = {
  getUnfinishedRaceStatus,
};

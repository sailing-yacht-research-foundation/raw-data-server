const { addDays, subDays, addHours, subHours } = require('date-fns');
const { getUnfinishedRaceStatus } = require('../competitionUnitUtil');
const { competitionUnitStatus } = require('../../syrf-schema/enums');

describe('competitionUnitUtil.js', () => {
  describe('When getUnfinishedRaceStatus is called', () => {
    it('should return ONGOING competition status when start date is before today', () => {
      const raceStartDate = subDays(new Date(), 1);

      const status = getUnfinishedRaceStatus(raceStartDate);

      expect(status).toBe(competitionUnitStatus.ONGOING);
    });

    it('should return ONGOING competition status when start date is today and time is before time now', () => {
      const raceStartDate = subHours(new Date(), 1);

      const status = getUnfinishedRaceStatus(raceStartDate);

      expect(status).toBe(competitionUnitStatus.ONGOING);
    });

    it('should return ONGOING competition status when start date is today and time is after time now', () => {
      const raceStartDate = addHours(new Date(), 1);

      const status = getUnfinishedRaceStatus(raceStartDate);

      expect(status).toBe(competitionUnitStatus.ONGOING);
    });

    it('should return SCHEDULED competition status when start date after today', () => {
      const raceStartDate = addDays(new Date(), 1);

      const status = getUnfinishedRaceStatus(raceStartDate);

      expect(status).toBe(competitionUnitStatus.SCHEDULED);
    });
  });
});

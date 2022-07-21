const utils = require('../utils');

describe('utils.js', () => {
  describe('when getHullsCount is called', () => {
    it('should return 1 if type is monohull', () => {
      expect(utils.getHullsCount('monohull')).toBe(1);
    });
    it('should return 2 if type is catamaran', () => {
      expect(utils.getHullsCount('catamaran')).toBe(2);
    });
    it('should return 3 if type is trimaran', () => {
      expect(utils.getHullsCount('trimaran')).toBe(3);
    });
    it('should return null if type is unknown', () => {
      expect(utils.getHullsCount('J70')).toBe(null);
    });
  });
});

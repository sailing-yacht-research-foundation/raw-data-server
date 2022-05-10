const { appendArray } = require('../arrayUtils');

describe('arrayUtil.js', () => {
  describe('When appendArray is called', () => {
    it('should not do anything if second parameter is undefined', () => {
      const firstArr = [1,2,3];

      appendArray(firstArr);

      expect(firstArr).toEqual(firstArr);
    });

    it('should append the second array to the first array passed', () => {
      const firstArr = [1,2,3];
      const secondArr = [4,5,6];

      appendArray(firstArr, secondArr);

      expect(firstArr).toEqual([1,2,3,4,5,6]);
    });
  });
});

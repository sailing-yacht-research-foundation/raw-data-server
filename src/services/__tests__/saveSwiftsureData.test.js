const db = require('../../models');
const saveSwiftsureData = require('../non-automatable/saveSwiftsureData');
const jsonData = require('../../test-files/swiftsure.json');

describe('Storing swiftsure data to DB', () => {
  const bulkCreateSpies = {};
  const swiftsureKeys = Object.keys(db).filter((i) => i.indexOf('swiftsure') === 0);

  beforeAll(async () => {
    await db.sequelize.sync();
    for (key of swiftsureKeys) {
      const spy = jest.spyOn(db[key], 'bulkCreate');
      bulkCreateSpies[key] = spy;
    }
  });
  afterAll(async () => {
    for (key of swiftsureKeys) {
      await db[key].destroy({ truncate: true });
    }
    await db.sequelize.close();
    jest.restoreAllMocks();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not save anything when json data is empty', async () => {
    await saveSwiftsureData({});
    for (key of Object.keys(bulkCreateSpies)) {
      expect(bulkCreateSpies[key]).toHaveBeenCalledTimes(0);
    }
  });
  it('should save data correctly', async () => {
    await saveSwiftsureData(jsonData);
    for (key of Object.keys(bulkCreateSpies)) {
      const passedData = jsonData[key[0].toUpperCase() + key.slice(1)];
      if (passedData) {
        expect(bulkCreateSpies[key]).toHaveBeenCalledWith(
          passedData,
          expect.anything(),
        );
      }
    }
  });
});

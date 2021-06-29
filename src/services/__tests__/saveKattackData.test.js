const db = require('../../models');
const saveKattackData = require('../saveKattackData');

const jsonData = require('../../test-files/kattack.json');

describe('Storing kattack data to DB', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  afterAll(async () => {
    await db.kattackYachtClub.destroy.destroy({ truncate: true });
    await db.kattackRace.destroy.destroy({ truncate: true });
    await db.kattackDevice.destroy.destroy({ truncate: true });
    await db.kattackPosition.destroy.destroy({ truncate: true });
    await db.kattackWaypoint.destroy.destroy({ truncate: true });
    await db.kattackSuccessfulUrl.destroy({ truncate: true });
    await db.kattackFailedUrl.destroy({ truncate: true });
    await db.sequelize.close();
  });
  it('should not save anything when empty data', async () => {
    const createYachtClub = jest.spyOn(db.kattackYachtClub, 'bulkCreate');
    const createRace = jest.spyOn(db.kattackRace, 'bulkCreate');
    const createDevice = jest.spyOn(db.kattackDevice, 'bulkCreate');
    const createPosition = jest.spyOn(db.kattackPosition, 'bulkCreate');
    const createWaypoint = jest.spyOn(db.kattackWaypoint, 'bulkCreate');

    await saveKattackData({});

    expect(createYachtClub).toHaveBeenCalledTimes(0);
    expect(createRace).toHaveBeenCalledTimes(0);
    expect(createDevice).toHaveBeenCalledTimes(0);
    expect(createPosition).toHaveBeenCalledTimes(0);
    expect(createWaypoint).toHaveBeenCalledTimes(0);
  });
  it('should save data correctly', async () => {
    const createYachtClub = jest.spyOn(db.kattackYachtClub, 'bulkCreate');
    const createRace = jest.spyOn(db.kattackRace, 'bulkCreate');
    const createDevice = jest.spyOn(db.kattackDevice, 'bulkCreate');
    const createPosition = jest.spyOn(db.kattackPosition, 'bulkCreate');
    const createWaypoint = jest.spyOn(db.kattackWaypoint, 'bulkCreate');

    await saveKattackData(jsonData);

    expect(createYachtClub).toHaveBeenCalledTimes(1);
    expect(createRace).toHaveBeenCalledTimes(1);
    expect(createDevice).toHaveBeenCalledTimes(1);
    expect(createPosition).toHaveBeenCalledTimes(1);
    expect(createWaypoint).toHaveBeenCalledTimes(1);
  });
  it('should throw error when one fails to execute', async () => {
    const invalidData = Object.assign({}, jsonData);
    invalidData.KattackRace = [
      ...invalidData.KattackRace,
      {
        original_id: '1011',
        url: 'http://kws.kattack.com/GEPlayer/GMPosDisplay.aspx?FeedID=1011',
      },
    ];
    const response = await saveKattackData(invalidData);
    expect(response).toEqual(expect.stringContaining('notNull Violation'));
  });
});

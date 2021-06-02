const db = require('../../models');
const saveKattackData = require('../saveKattackData');

const jsonData = require('../../test-files/kattack.json');

describe('Storing kattack data to DB', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  afterAll(async () => {
    await db.kattackYachtClub.destroy({
      truncate: true,
    });
    await db.kattackRace.destroy({
      truncate: true,
    });
    await db.kattackDevice.destroy({
      truncate: true,
    });
    await db.kattackPosition.destroy({
      truncate: true,
    });
    await db.kattackWaypoint.destroy({
      truncate: true,
    });
    await db.sequelize.close();
  });

  afterEach(async () => {
    jest.resetAllMocks();
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
});

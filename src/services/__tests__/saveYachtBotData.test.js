const db = require('../../models');
const saveYachtBotData = require('../saveYachtBotData');

const jsonData = require('../../test-files/yachtbot.json');

describe('Storing YachtBot data to DB', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  afterAll(async () => {
    await db.yachtBotRace.destroy.destroy({ truncate: true });
    await db.yachtBotBuoy.destroy.destroy({ truncate: true });
    await db.yachtBotYacht.destroy.destroy({ truncate: true });
    await db.yachtBotPosition.destroy({ truncate: true });
    await db.yachtBotFailedUrl.destroy({ truncate: true });
    await db.yachtBotSuccessfulUrl.destroy({ truncate: true });
    await db.sequelize.close();
  });
  it('should not save anything when empty data', async () => {
    const createRace = jest.spyOn(db.yachtBotRace, 'bulkCreate');
    const createBuoy = jest.spyOn(db.yachtBotBuoy, 'bulkCreate');
    const createYacht = jest.spyOn(db.yachtBotYacht, 'bulkCreate');
    const createPosition = jest.spyOn(db.yachtBotPosition, 'bulkCreate');
    await saveYachtBotData({});
    expect(createRace).toHaveBeenCalledTimes(0);
    expect(createBuoy).toHaveBeenCalledTimes(0);
    expect(createYacht).toHaveBeenCalledTimes(0);
    expect(createPosition).toHaveBeenCalledTimes(0);
  });
  it('should save data correctly', async () => {
    const createRace = jest.spyOn(db.yachtBotRace, 'bulkCreate');
    const createBuoy = jest.spyOn(db.yachtBotBuoy, 'bulkCreate');
    const createYacht = jest.spyOn(db.yachtBotYacht, 'bulkCreate');
    const createPosition = jest.spyOn(db.yachtBotPosition, 'bulkCreate');
    await saveYachtBotData(jsonData);
    expect(createRace).toHaveBeenCalledTimes(1);
    expect(createBuoy).toHaveBeenCalledTimes(1);
    expect(createYacht).toHaveBeenCalledTimes(1);
    expect(createPosition).toHaveBeenCalledTimes(1);
  });
});

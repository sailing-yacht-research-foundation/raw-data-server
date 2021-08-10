const axios = require('axios');
const db = require('../../models');
const normalizeObj = require('../normalization/normalizeYachtBot');
const normalizeSpy = jest
  .spyOn(normalizeObj, 'normalizeRace')
  .mockImplementation(() => Promise.resolve({ id: '123' }));
const saveYachtBotData = require('../saveYachtBotData');
const jsonData = require('../../test-files/yachtbot.json');

describe('Storing YachtBot data to DB', () => {
  let createRace, createBuoy, createYacht, createPosition, axiosPostSpy;

  beforeAll(async () => {
    await db.sequelize.sync();
    createRace = jest.spyOn(db.yachtBotRace, 'bulkCreate');
    createBuoy = jest.spyOn(db.yachtBotBuoy, 'bulkCreate');
    createYacht = jest.spyOn(db.yachtBotYacht, 'bulkCreate');
    createPosition = jest.spyOn(db.yachtBotPosition, 'bulkCreate');
    axiosPostSpy = jest.spyOn(axios, 'post').mockImplementation(() => Promise.resolve());
  });
  afterAll(async () => {
    await db.yachtBotRace.destroy({ truncate: true });
    await db.yachtBotBuoy.destroy({ truncate: true });
    await db.yachtBotYacht.destroy({ truncate: true });
    await db.yachtBotPosition.destroy({ truncate: true });
    await db.yachtBotFailedUrl.destroy({ truncate: true });
    await db.yachtBotSuccessfulUrl.destroy({ truncate: true });
    await db.sequelize.close();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not save anything when empty data', async () => {
    await saveYachtBotData({});
    expect(createRace).toHaveBeenCalledTimes(0);
    expect(createBuoy).toHaveBeenCalledTimes(0);
    expect(createYacht).toHaveBeenCalledTimes(0);
    expect(createPosition).toHaveBeenCalledTimes(0);
    expect(normalizeSpy).toHaveBeenCalledTimes(0);
    expect(axiosPostSpy).toHaveBeenCalledTimes(0);
  });
  it('should save data correctly', async () => {
    await saveYachtBotData(jsonData);
    expect(createRace).toHaveBeenCalledWith(
      jsonData.YachtBotRace,
      expect.anything(),
    );
    expect(createBuoy).toHaveBeenCalledWith(
      jsonData.YachtBotBuoy,
      expect.anything(),
    );
    expect(createYacht).toHaveBeenCalledWith(
      jsonData.YachtBotYacht,
      expect.anything(),
    );
    expect(createPosition).toHaveBeenCalledWith(
      jsonData.YachtBotPosition,
      expect.anything(),
    );
    expect(normalizeSpy).toHaveBeenCalledWith(jsonData, expect.anything());
    expect(axiosPostSpy).toHaveBeenCalledTimes(1);
  });
});

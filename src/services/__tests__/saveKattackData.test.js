const axios = require('axios');
const db = require('../../models');
const normalizeObj = require('../normalization/normalizeKattack');
const normalizeSpy = jest
  .spyOn(normalizeObj, 'normalizeRace')
  .mockImplementation(() => Promise.resolve({ id: '123' }));
const saveKattackData = require('../saveKattackData');
const jsonData = require('../../test-files/kattack.json');

describe('Storing kattack data to DB', () => {
  let createYachtClub,
    createRace,
    createDevice,
    createPosition,
    createWaypoint,
    axiosPostSpy;

  beforeAll(async () => {
    await db.sequelize.sync();
    createYachtClub = jest.spyOn(db.kattackYachtClub, 'bulkCreate');
    createRace = jest.spyOn(db.kattackRace, 'bulkCreate');
    createDevice = jest.spyOn(db.kattackDevice, 'bulkCreate');
    createPosition = jest.spyOn(db.kattackPosition, 'bulkCreate');
    createWaypoint = jest.spyOn(db.kattackWaypoint, 'bulkCreate');
    axiosPostSpy = jest
      .spyOn(axios, 'post')
      .mockImplementation(() => Promise.resolve());
  });
  afterAll(async () => {
    await db.kattackYachtClub.destroy({ truncate: true });
    await db.kattackRace.destroy({ truncate: true });
    await db.kattackDevice.destroy({ truncate: true });
    await db.kattackPosition.destroy({ truncate: true });
    await db.kattackWaypoint.destroy({ truncate: true });
    await db.kattackSuccessfulUrl.destroy({ truncate: true });
    await db.kattackFailedUrl.destroy({ truncate: true });
    await db.sequelize.close();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not save anything when empty data', async () => {
    await saveKattackData({});
    expect(createYachtClub).toHaveBeenCalledTimes(0);
    expect(createRace).toHaveBeenCalledTimes(0);
    expect(createDevice).toHaveBeenCalledTimes(0);
    expect(createPosition).toHaveBeenCalledTimes(0);
    expect(createWaypoint).toHaveBeenCalledTimes(0);
    expect(normalizeSpy).toHaveBeenCalledTimes(0);
    expect(axiosPostSpy).toHaveBeenCalledTimes(0);
  });
  it('should save data correctly', async () => {
    await saveKattackData(jsonData);
    expect(createYachtClub).toHaveBeenCalledWith(
      jsonData.KattackYachtClub,
      expect.anything(),
    );
    expect(createRace).toHaveBeenCalledWith(
      jsonData.KattackRace,
      expect.anything(),
    );
    expect(createDevice).toHaveBeenCalledWith(
      jsonData.KattackDevice,
      expect.anything(),
    );
    expect(createPosition).toHaveBeenCalledWith(
      jsonData.KattackPosition,
      expect.anything(),
    );
    expect(createWaypoint).toHaveBeenCalledWith(
      jsonData.KattackWaypoint,
      expect.anything(),
    );
    expect(normalizeSpy).toHaveBeenCalledWith(jsonData, expect.anything());
    expect(axiosPostSpy).toHaveBeenCalledTimes(
      process.env.GEO_DATA_SLICER ? 1 : 0,
    );
  });
});

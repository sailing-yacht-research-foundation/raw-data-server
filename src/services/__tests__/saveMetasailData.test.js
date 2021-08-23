const axios = require('axios');
const db = require('../../models');
const normalizeObj = require('../normalization/normalizeMetasail');
const normalizeSpy = jest
  .spyOn(normalizeObj, 'normalizeRace')
  .mockImplementation(() => Promise.resolve([{ id: '123' }]));
const saveMetasailData = require('../saveMetasailData');

const jsonData = require('../../test-files/metasail.json');

describe('Storing Metasail data to DB', () => {
  let createEvent,
    createRace,
    createBoat,
    createBuoy,
    createGate,
    createPosition,
    axiosPostSpy;

  beforeAll(async () => {
    await db.sequelize.sync();
    createEvent = jest.spyOn(db.metasailEvent, 'bulkCreate');
    createRace = jest.spyOn(db.metasailRace, 'bulkCreate');
    createBoat = jest.spyOn(db.metasailBoat, 'bulkCreate');
    createBuoy = jest.spyOn(db.metasailBuoy, 'bulkCreate');
    createGate = jest.spyOn(db.metasailGate, 'bulkCreate');
    createPosition = jest.spyOn(db.metasailPosition, 'bulkCreate');
    axiosPostSpy = jest.spyOn(axios, 'post').mockImplementation(() => Promise.resolve());
  });
  afterAll(async () => {
    await db.metasailEvent.destroy({ truncate: true });
    await db.metasailRace.destroy({ truncate: true });
    await db.metasailBoat.destroy({ truncate: true });
    await db.metasailBuoy.destroy({ truncate: true });
    await db.metasailGate.destroy({ truncate: true });
    await db.metasailPosition.destroy({ truncate: true });
    await db.metasailFailedUrl.destroy({ truncate: true });
    await db.metasailSuccessfulUrl.destroy({ truncate: true });
    await db.sequelize.close();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not save anything when empty data', async () => {
    await saveMetasailData({});
    expect(createEvent).toHaveBeenCalledTimes(0);
    expect(createRace).toHaveBeenCalledTimes(0);
    expect(createBoat).toHaveBeenCalledTimes(0);
    expect(createPosition).toHaveBeenCalledTimes(0);
    expect(createBuoy).toHaveBeenCalledTimes(0);
    expect(createGate).toHaveBeenCalledTimes(0);
    expect(normalizeSpy).toHaveBeenCalledTimes(0);
    expect(axiosPostSpy).toHaveBeenCalledTimes(0);
  });
  it('should save data correctly', async () => {
    await saveMetasailData(jsonData);
    expect(createEvent).toHaveBeenCalledWith(
      jsonData.MetasailEvent,
      expect.anything(),
    );
    expect(createRace).toHaveBeenCalledWith(
      jsonData.MetasailRace,
      expect.anything(),
    );
    expect(createBoat).toHaveBeenCalledWith(
      jsonData.MetasailBoat,
      expect.anything(),
    );
    expect(createPosition).toHaveBeenCalledWith(
      jsonData.MetasailPosition,
      expect.anything(),
    );
    expect(createBuoy).toHaveBeenCalledWith(
      jsonData.MetasailBuoy,
      expect.anything(),
    );
    expect(createGate).toHaveBeenCalledWith(
      jsonData.MetasailGate,
      expect.anything(),
    );
    expect(normalizeSpy).toHaveBeenCalledWith(jsonData, expect.anything());
    expect(axiosPostSpy).toHaveBeenCalledTimes(1);
  });
});

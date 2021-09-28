const axios = require('axios');
const db = require('../../models');
const saveGeovoileData = require('../saveGeovoileData');
const jsonData = require('../../test-files/geovoil-modern.json');

describe('Storing Modern Geovoile data data to DB', () => {
  let createRace,
    createGeovoileBoat,
    createGeovoileBoatSailor,
    createPosition,
    axiosPostSpy;

  beforeAll(async () => {
    await db.sequelize.sync();
    createRace = jest.spyOn(db.geovoileRace, 'create');
    createGeovoileBoat = jest.spyOn(db.geovoileBoat, 'bulkCreate');
    createGeovoileBoatSailor = jest.spyOn(db.geovoileBoatSailor, 'bulkCreate');
    createPosition = jest.spyOn(db.geovoileBoatPosition, 'bulkCreate');
    axiosPostSpy = jest
      .spyOn(axios, 'post')
      .mockImplementation(() => Promise.resolve());
  });
  afterAll(async () => {
    await db.geovoileRace.destroy({ truncate: true });
    await db.geovoileBoat.destroy({ truncate: true });
    await db.geovoileBoatSailor.destroy({ truncate: true });
    await db.geovoileBoatPosition.destroy({ truncate: true });
    await db.geovoileSuccessfulUrl.destroy({ truncate: true });
    await db.geovoileFailedUrl.destroy({ truncate: true });
    await db.sequelize.close();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not save anything when empty data', async () => {
    await saveGeovoileData({});
    expect(createRace).toHaveBeenCalledTimes(0);
    expect(createGeovoileBoat).toHaveBeenCalledTimes(0);
    expect(createGeovoileBoatSailor).toHaveBeenCalledTimes(0);
    expect(createPosition).toHaveBeenCalledTimes(0);
    expect(axiosPostSpy).toHaveBeenCalledTimes(0);
  });
  it('should save data correctly', async () => {
    await saveGeovoileData(jsonData);
    expect(createRace).toHaveBeenCalledWith(
      expect.objectContaining(jsonData.geovoileRace),
      expect.anything(),
    );

    expect(createGeovoileBoat).toHaveBeenCalledTimes(1);
    expect(createGeovoileBoatSailor).toHaveBeenCalledTimes(1);
    expect(createPosition).toHaveBeenCalledTimes(1);
  });
});

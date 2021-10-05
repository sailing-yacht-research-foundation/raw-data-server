const axios = require('axios');
const db = require('../../models');
const normalizeObj = require('../normalization/normalizeBluewater');
const normalizeSpy = jest
  .spyOn(normalizeObj, 'normalizeRace')
  .mockImplementation(() => Promise.resolve({ id: '123' }));
const saveBluewaterData = require('../saveBluewaterData');
const jsonData = require('../../test-files/bluewater.json');

describe('Storing bluewater data to DB', () => {
  let createRace,
    createBoat,
    createBoatHandicap,
    createBoatSocialMedia,
    createCrew,
    createCrewSocialMedia,
    createMap,
    createPosition,
    createAnnouncement,
    axiosPostSpy;

  beforeAll(async () => {
    await db.sequelize.sync();
    createRace = jest.spyOn(db.bluewaterRace, 'bulkCreate');
    createBoat = jest.spyOn(db.bluewaterBoat, 'bulkCreate');
    createBoatHandicap = jest.spyOn(db.bluewaterBoatHandicap, 'bulkCreate');
    createBoatSocialMedia = jest.spyOn(
      db.bluewaterBoatSocialMedia,
      'bulkCreate',
    );
    createCrew = jest.spyOn(db.bluewaterCrew, 'bulkCreate');
    createCrewSocialMedia = jest.spyOn(
      db.bluewaterCrewSocialMedia,
      'bulkCreate',
    );
    createMap = jest.spyOn(db.bluewaterMap, 'bulkCreate');
    createPosition = jest.spyOn(db.bluewaterPosition, 'bulkCreate');
    createAnnouncement = jest.spyOn(db.bluewaterAnnouncement, 'bulkCreate');
    axiosPostSpy = jest.spyOn(axios, 'post').mockImplementation(() => Promise.resolve());
  });
  afterAll(async () => {
    await db.bluewaterRace.destroy({ truncate: true });
    await db.bluewaterBoat.destroy({ truncate: true });
    await db.bluewaterBoatHandicap.destroy({ truncate: true });
    await db.bluewaterBoatSocialMedia.destroy({ truncate: true });
    await db.bluewaterCrew.destroy({ truncate: true });
    await db.bluewaterCrewSocialMedia.destroy({ truncate: true });
    await db.bluewaterMap.destroy({ truncate: true });
    await db.bluewaterPosition.destroy({ truncate: true });
    await db.bluewaterAnnouncement.destroy({ truncate: true });
    await db.bluewaterSuccessfulUrl.destroy({ truncate: true });
    await db.bluewaterFailedUrl.destroy({ truncate: true });
    await db.sequelize.close();
    jest.restoreAllMocks();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not save anything when json data is empty', async () => {
    await saveBluewaterData({});
    expect(createRace).toHaveBeenCalledTimes(0);
    expect(createBoat).toHaveBeenCalledTimes(0);
    expect(createBoatHandicap).toHaveBeenCalledTimes(0);
    expect(createBoatSocialMedia).toHaveBeenCalledTimes(0);
    expect(createCrew).toHaveBeenCalledTimes(0);
    expect(createCrewSocialMedia).toHaveBeenCalledTimes(0);
    expect(createMap).toHaveBeenCalledTimes(0);
    expect(createPosition).toHaveBeenCalledTimes(0);
    expect(createAnnouncement).toHaveBeenCalledTimes(0);
    expect(normalizeSpy).toHaveBeenCalledTimes(0);
    expect(axiosPostSpy).toHaveBeenCalledTimes(0);
  });
  it('should save data correctly', async () => {
    await saveBluewaterData(jsonData);
    expect(createRace).toHaveBeenCalledWith(
      jsonData.BluewaterRace,
      expect.anything(),
    );
    expect(createBoat).toHaveBeenCalledWith(
      jsonData.BluewaterBoat,
      expect.anything(),
    );
    expect(createBoatHandicap).toHaveBeenCalledWith(
      jsonData.BluewaterBoatHandicap,
      expect.anything(),
    );
    expect(createBoatSocialMedia).toHaveBeenCalledWith(
      jsonData.BluewaterBoatSocialMedia,
      expect.anything(),
    );
    expect(createCrew).toHaveBeenCalledWith(
      jsonData.BluewaterCrew,
      expect.anything(),
    );
    expect(createCrewSocialMedia).toHaveBeenCalledWith(
      jsonData.BluewaterCrewSocialMedia,
      expect.anything(),
    );
    expect(createMap).toHaveBeenCalledWith(
      jsonData.BluewaterMap,
      expect.anything(),
    );
    expect(createPosition).toHaveBeenCalledWith(
      jsonData.BluewaterPosition,
      expect.anything(),
    );
    expect(createAnnouncement).toHaveBeenCalledWith(
      jsonData.BluewaterAnnouncement,
      expect.anything(),
    );
    expect(normalizeSpy).toHaveBeenCalledWith(jsonData, expect.anything());
    expect(axiosPostSpy).toHaveBeenCalledTimes(process.env.GEO_DATA_SLICER ? 1 : 0);
  });
});

const axios = require('axios');
const db = require('../../models');
const normalizeObj = require('../normalization/normalizeKwindoo');
const normalizeSpy = jest
  .spyOn(normalizeObj, 'normalizeRace')
  .mockImplementation(() => Promise.resolve([{ id: '123' }]));
const saveKwindooData = require('../saveKwindooData');

const jsonData = require('../../test-files/kwindoo.json');

describe('Storing kwindoo data to DB', () => {
  let createRegattaOwner,
    createRegatta,
    createRace,
    createComment,
    createHomeportLocation,
    createMarker,
    createMIA,
    createPOI,
    createPosition,
    createRunningGroup,
    createVideoStream,
    createWaypoint,
    axiosPostSpy;

  beforeAll(async () => {
    await db.sequelize.sync();
    createRegattaOwner = jest.spyOn(db.kwindooRegattaOwner, 'bulkCreate');
    createRegatta = jest.spyOn(db.kwindooRegatta, 'bulkCreate');
    createRace = jest.spyOn(db.kwindooRace, 'bulkCreate');
    createComment = jest.spyOn(db.kwindooComment, 'bulkCreate');
    createHomeportLocation = jest.spyOn(
      db.kwindooHomeportLocation,
      'bulkCreate',
    );
    createMarker = jest.spyOn(db.kwindooMarker, 'bulkCreate');
    createMIA = jest.spyOn(db.kwindooMIA, 'bulkCreate');
    createPOI = jest.spyOn(db.kwindooPOI, 'bulkCreate');
    createPosition = jest.spyOn(db.kwindooPosition, 'bulkCreate');
    createRunningGroup = jest.spyOn(db.kwindooRunningGroup, 'bulkCreate');
    createVideoStream = jest.spyOn(db.kwindooVideoStream, 'bulkCreate');
    createWaypoint = jest.spyOn(db.kwindooWaypoint, 'bulkCreate');
    axiosPostSpy = jest.spyOn(axios, 'post').mockImplementation(() => Promise.resolve());
  });
  afterAll(async () => {
    await db.kwindooRegattaOwner.destroy({ truncate: true });
    await db.kwindooRegatta.destroy({ truncate: true });
    await db.kwindooRace.destroy({ truncate: true });
    await db.kwindooBoat.destroy({ truncate: true });
    await db.kwindooComment.destroy({ truncate: true });
    await db.kwindooHomeportLocation.destroy({ truncate: true });
    await db.kwindooMarker.destroy({ truncate: true });
    await db.kwindooMIA.destroy({ truncate: true });
    await db.kwindooPOI.destroy({ truncate: true });
    await db.kwindooPosition.destroy({ truncate: true });
    await db.kwindooRunningGroup.destroy({ truncate: true });
    await db.kwindooVideoStream.destroy({ truncate: true });
    await db.kwindooWaypoint.destroy({ truncate: true });
    await db.kwindooFailedUrl.destroy({ truncate: true });
    await db.kwindooSuccessfulUrl.destroy({ truncate: true });
    await db.sequelize.close();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not save anything when empty data', async () => {
    await saveKwindooData({});
    expect(createRegattaOwner).toHaveBeenCalledTimes(0);
    expect(createRegatta).toHaveBeenCalledTimes(0);
    expect(createRace).toHaveBeenCalledTimes(0);
    expect(createComment).toHaveBeenCalledTimes(0);
    expect(createHomeportLocation).toHaveBeenCalledTimes(0);
    expect(createMarker).toHaveBeenCalledTimes(0);
    expect(createMIA).toHaveBeenCalledTimes(0);
    expect(createPOI).toHaveBeenCalledTimes(0);
    expect(createPosition).toHaveBeenCalledTimes(0);
    expect(createRunningGroup).toHaveBeenCalledTimes(0);
    expect(createVideoStream).toHaveBeenCalledTimes(0);
    expect(createWaypoint).toHaveBeenCalledTimes(0);
    expect(normalizeSpy).toHaveBeenCalledTimes(0);
    expect(axiosPostSpy).toHaveBeenCalledTimes(0);
  });
  it('should save data correctly', async () => {
    await saveKwindooData(jsonData);
    expect(createRegattaOwner).toHaveBeenCalledWith(
      jsonData.KwindooRegattaOwner,
      expect.anything(),
    );
    expect(createRegatta).toHaveBeenCalledWith(
      jsonData.KwindooRegatta,
      expect.anything(),
    );
    expect(createRace).toHaveBeenCalledWith(
      jsonData.KwindooRace,
      expect.anything(),
    );
    expect(createComment).toHaveBeenCalledWith(
      jsonData.KwindooComment,
      expect.anything(),
    );
    expect(createHomeportLocation).toHaveBeenCalledWith(
      jsonData.KwindooHomeportLocation,
      expect.anything(),
    );
    expect(createMarker).toHaveBeenCalledWith(
      jsonData.KwindooMarker,
      expect.anything(),
    );
    expect(createMIA).toHaveBeenCalledWith(
      jsonData.KwindooMIA,
      expect.anything(),
    );
    expect(createPOI).toHaveBeenCalledWith(
      jsonData.KwindooPOI,
      expect.anything(),
    );
    expect(createPosition).toHaveBeenCalledWith(
      jsonData.KwindooPosition,
      expect.anything(),
    );
    expect(createRunningGroup).toHaveBeenCalledWith(
      jsonData.KwindooRunningGroup,
      expect.anything(),
    );
    expect(createVideoStream).toHaveBeenCalledWith(
      jsonData.KwindooVideoStream,
      expect.anything(),
    );
    expect(createWaypoint).toHaveBeenCalledWith(
      jsonData.KwindooWaypoint,
      expect.anything(),
    );
    expect(normalizeSpy).toHaveBeenCalledWith(jsonData, expect.anything());
    expect(axiosPostSpy).toHaveBeenCalledTimes(1);
  });
});

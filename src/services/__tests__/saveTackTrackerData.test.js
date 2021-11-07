const axios = require('axios');
const db = require('../../models');
const normalizeObj = require('../normalization/normalizeTackTracker');
const normalizeSpy = jest
  .spyOn(normalizeObj, 'normalizeRace')
  .mockImplementation(() => Promise.resolve([{ id: '123' }]));
const saveTackTrackerData = require('../saveTackTrackerData');
const jsonData = require('../../test-files/tackTracker.json');

describe('Storing TackTracker data to DB', () => {
  let createRegatta,
    createRace,
    createBoat,
    createDefault,
    createFinish,
    createMark,
    createPosition,
    createStart,
    axiosPostSpy;

  beforeAll(async () => {
    await db.sequelize.sync();
    createRegatta = jest.spyOn(db.tackTrackerRegatta, 'bulkCreate');
    createRace = jest.spyOn(db.tackTrackerRace, 'bulkCreate');
    createBoat = jest.spyOn(db.tackTrackerBoat, 'bulkCreate');
    createDefault = jest.spyOn(db.tackTrackerDefault, 'bulkCreate');
    createFinish = jest.spyOn(db.tackTrackerFinish, 'bulkCreate');
    createMark = jest.spyOn(db.tackTrackerMark, 'bulkCreate');
    createPosition = jest.spyOn(db.tackTrackerPosition, 'bulkCreate');
    createStart = jest.spyOn(db.tackTrackerStart, 'bulkCreate');
    axiosPostSpy = jest.spyOn(axios, 'post').mockImplementation(() => Promise.resolve());
  });
  afterAll(async () => {
    await db.tackTrackerRegatta.destroy({ truncate: true });
    await db.tackTrackerRace.destroy({ truncate: true });
    await db.tackTrackerBoat.destroy({ truncate: true });
    await db.tackTrackerDefault.destroy({ truncate: true });
    await db.tackTrackerFinish.destroy({ truncate: true });
    await db.tackTrackerMark.destroy({ truncate: true });
    await db.tackTrackerPosition.destroy({ truncate: true });
    await db.tackTrackerStart.destroy({ truncate: true });
    await db.tackTrackerFailedUrl.destroy({ truncate: true });
    await db.tackTrackerSuccessfulUrl.destroy({ truncate: true });
    await db.readyAboutRaceMetadata.destroy({ truncate: true });
    await db.readyAboutTrackGeoJsonLookup.destroy({ truncate: true });
    await db.sequelize.close();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not save anything when empty data', async () => {
    await saveTackTrackerData({});
    expect(createRegatta).toHaveBeenCalledTimes(0);
    expect(createRace).toHaveBeenCalledTimes(0);
    expect(createBoat).toHaveBeenCalledTimes(0);
    expect(createDefault).toHaveBeenCalledTimes(0);
    expect(createFinish).toHaveBeenCalledTimes(0);
    expect(createMark).toHaveBeenCalledTimes(0);
    expect(createPosition).toHaveBeenCalledTimes(0);
    expect(createStart).toHaveBeenCalledTimes(0);
    expect(normalizeSpy).toHaveBeenCalledTimes(0);
    expect(normalizeSpy).toHaveBeenCalledTimes(0);
    expect(axiosPostSpy).toHaveBeenCalledTimes(0);
  });
  it('should save data correctly', async () => {
    await saveTackTrackerData(jsonData);
    expect(createRegatta).toHaveBeenCalledWith(
      [Object.assign({}, jsonData.TackTrackerRegatta[0], { TackTrackerRaces: jsonData.TackTrackerRace })],
      expect.anything(),
    );
    expect(createBoat).toHaveBeenCalledWith(
      jsonData.TackTrackerBoat,
      expect.anything(),
    );
    expect(createDefault).toHaveBeenCalledWith(
      jsonData.TackTrackerDefault,
      expect.anything(),
    );
    expect(createFinish).toHaveBeenCalledWith(
      jsonData.TackTrackerFinish,
      expect.anything(),
    );
    expect(createMark).toHaveBeenCalledWith(
      jsonData.TackTrackerMark,
      expect.anything(),
    );
    expect(createPosition).toHaveBeenCalledWith(
      jsonData.TackTrackerPosition,
      expect.anything(),
    );
    expect(createStart).toHaveBeenCalledWith(
      jsonData.TackTrackerStart,
      expect.anything(),
    );
    expect(normalizeSpy).toHaveBeenCalledWith(jsonData, expect.anything());
    expect(axiosPostSpy).toHaveBeenCalledTimes(process.env.GEO_DATA_SLICER ? 1 : 0);
  });
});

const axios = require('axios');
const db = require('../../models');
const normalizeObj = require('../normalization/normalizeRaceQs');
const normalizeSpy = jest
  .spyOn(normalizeObj, 'normalizeRace')
  .mockImplementation(() => Promise.resolve([{ id: '123' }]));
const saveRaceQsData = require('../saveRaceQsData');

const jsonData = require('../../test-files/raceQs.json');

describe('Storing RaceQS data to DB', () => {
  let createRegatta,
    createEvent,
    createDivision,
    createParticipant,
    createPosition,
    createRoute,
    createStart,
    createWaypoint,
    axiosPostSpy;

  beforeAll(async () => {
    await db.sequelize.sync();
    createRegatta = jest.spyOn(db.raceQsRegatta, 'bulkCreate');
    createEvent = jest.spyOn(db.raceQsEvent, 'bulkCreate');
    createDivision = jest.spyOn(db.raceQsDivision, 'bulkCreate');
    createParticipant = jest.spyOn(db.raceQsParticipant, 'bulkCreate');
    createPosition = jest.spyOn(db.raceQsPosition, 'bulkCreate');
    createRoute = jest.spyOn(db.raceQsRoute, 'bulkCreate');
    createStart = jest.spyOn(db.raceQsStart, 'bulkCreate');
    createWaypoint = jest.spyOn(db.raceQsWaypoint, 'bulkCreate');
    axiosPostSpy = jest
      .spyOn(axios, 'post')
      .mockImplementation(() => Promise.resolve());
  });
  afterAll(async () => {
    await db.raceQsRegatta.destroy({ truncate: true });
    await db.raceQsEvent.destroy({ truncate: true });
    await db.raceQsDivision.destroy({ truncate: true });
    await db.raceQsParticipant.destroy({ truncate: true });
    await db.raceQsPosition.destroy({ truncate: true });
    await db.raceQsRoute.destroy({ truncate: true });
    await db.raceQsStart.destroy({ truncate: true });
    await db.raceQsWaypoint.destroy({ truncate: true });
    await db.raceQsFailedUrl.destroy({ truncate: true });
    await db.raceQsSuccessfulUrl.destroy({ truncate: true });
    await db.readyAboutRaceMetadata.destroy({ truncate: true });
    await db.readyAboutTrackGeoJsonLookup.destroy({ truncate: true });
    await db.sequelize.close();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not save anything when empty data', async () => {
    await saveRaceQsData({});
    expect(createRegatta).toHaveBeenCalledTimes(0);
    expect(createEvent).toHaveBeenCalledTimes(0);
    expect(createDivision).toHaveBeenCalledTimes(0);
    expect(createParticipant).toHaveBeenCalledTimes(0);
    expect(createPosition).toHaveBeenCalledTimes(0);
    expect(createRoute).toHaveBeenCalledTimes(0);
    expect(createStart).toHaveBeenCalledTimes(0);
    expect(createWaypoint).toHaveBeenCalledTimes(0);
    expect(normalizeSpy).toHaveBeenCalledTimes(0);
    expect(axiosPostSpy).toHaveBeenCalledTimes(0);
  });
  it('should save data correctly', async () => {
    await saveRaceQsData(jsonData);
    expect(createRegatta).toHaveBeenCalledWith(
      jsonData.RaceQsRegatta,
      expect.anything(),
    );
    expect(createEvent).toHaveBeenCalledWith(
      jsonData.RaceQsEvent,
      expect.anything(),
    );
    expect(createDivision).toHaveBeenCalledWith(
      jsonData.RaceQsDivision,
      expect.anything(),
    );
    expect(createParticipant).toHaveBeenCalledWith(
      jsonData.RaceQsParticipant,
      expect.anything(),
    );
    expect(createPosition).toHaveBeenCalledWith(
      jsonData.RaceQsPosition,
      expect.anything(),
    );
    expect(createRoute).toHaveBeenCalledWith(
      jsonData.RaceQsRoute,
      expect.anything(),
    );
    expect(createStart).toHaveBeenCalledWith(
      jsonData.RaceQsStart,
      expect.anything(),
    );
    expect(createWaypoint).toHaveBeenCalledWith(
      jsonData.RaceQsWaypoint,
      expect.anything(),
    );
    expect(normalizeSpy).toHaveBeenCalledWith(jsonData, expect.anything());
    expect(axiosPostSpy).toHaveBeenCalledTimes(
      process.env.GEO_DATA_SLICER ? 1 : 0,
    );
  });
});

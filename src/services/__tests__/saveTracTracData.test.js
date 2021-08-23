const axios = require('axios');
const db = require('../../models');
const normalizeObj = require('../normalization/normalizeTracTrac');
const normalizeSpy = jest
  .spyOn(normalizeObj, 'normalizeRace')
  .mockImplementation(() => Promise.resolve([{ id: '123' }]));
const saveTracTracData = require('../saveTracTracData');
const jsonData = require('../../test-files/tractrac.json');

describe('Storing trac trac data to DB', () => {
  let createEmail,
    createClass,
    createRaceClass,
    createEvent,
    createRace,
    createCompetitor,
    createCompetitorPassing,
    createCompetitorPosition,
    createCompetitorResult,
    createControl,
    createControlPoint,
    createControlPointPosition,
    createRoute,
    axiosPostSpy;

  beforeAll(async () => {
    await db.sequelize.sync();
    createEmail = jest.spyOn(db.sailorEmail, 'bulkCreate');
    createClass = jest.spyOn(db.tractracClass, 'bulkCreate');
    createRaceClass = jest.spyOn(db.tractracRaceClass, 'bulkCreate');
    createEvent = jest.spyOn(db.tractracEvent, 'bulkCreate');
    createRace = jest.spyOn(db.tractracRace, 'bulkCreate');
    createCompetitor = jest.spyOn(db.tractracCompetitor, 'bulkCreate');
    createCompetitorPassing = jest.spyOn(
      db.tractracCompetitorPassing,
      'bulkCreate',
    );
    createCompetitorPosition = jest.spyOn(
      db.tractracCompetitorPosition,
      'bulkCreate',
    );
    createCompetitorResult = jest.spyOn(
      db.tractracCompetitorResult,
      'bulkCreate',
    );
    createControl = jest.spyOn(db.tractracControl, 'bulkCreate');
    createControlPoint = jest.spyOn(db.tractracControlPoint, 'bulkCreate');
    createControlPointPosition = jest.spyOn(
      db.tractracControlPointPosition,
      'bulkCreate',
    );
    createRoute = jest.spyOn(db.tractracRoute, 'bulkCreate');
    axiosPostSpy = jest.spyOn(axios, 'post').mockImplementation(() => Promise.resolve());
  });
  afterAll(async () => {
    await db.tractracEvent.destroy({ truncate: true });
    await db.tractracRace.destroy({ truncate: true });
    await db.tractracClass.destroy({ truncate: true });
    await db.tractracRaceClass.destroy({ truncate: true });
    await db.tractracClass.destroy({ truncate: true });
    await db.tractracCompetitor.destroy({ truncate: true });
    await db.tractracCompetitorPassing.destroy({ truncate: true });
    await db.tractracCompetitorPosition.destroy({ truncate: true });
    await db.tractracCompetitorResult.destroy({ truncate: true });
    await db.tractracControl.destroy({ truncate: true });
    await db.tractracControlPoint.destroy({ truncate: true });
    await db.tractracControlPointPosition.destroy({ truncate: true });
    await db.tractracRoute.destroy({ truncate: true });
    await db.sailorEmail.destroy({ truncate: true });
    await db.tractracFailedUrl.destroy({ truncate: true });
    await db.tractracSuccessfulUrl.destroy({ truncate: true });
    await db.sequelize.close();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not save anything when empty data', async () => {
    await saveTracTracData({});
    expect(createEmail).toHaveBeenCalledTimes(0);
    expect(createClass).toHaveBeenCalledTimes(0);
    expect(createRaceClass).toHaveBeenCalledTimes(0);
    expect(createEvent).toHaveBeenCalledTimes(0);
    expect(createRace).toHaveBeenCalledTimes(0);
    expect(createCompetitor).toHaveBeenCalledTimes(0);
    expect(createCompetitorPassing).toHaveBeenCalledTimes(0);
    expect(createCompetitorPosition).toHaveBeenCalledTimes(0);
    expect(createCompetitorResult).toHaveBeenCalledTimes(0);
    expect(createControl).toHaveBeenCalledTimes(0);
    expect(createControlPoint).toHaveBeenCalledTimes(0);
    expect(createControlPointPosition).toHaveBeenCalledTimes(0);
    expect(createRoute).toHaveBeenCalledTimes(0);
    expect(normalizeSpy).toHaveBeenCalledTimes(0);
    expect(axiosPostSpy).toHaveBeenCalledTimes(0);
  });
  it('should save trac trac data correctly', async () => {
    await saveTracTracData(jsonData);
    expect(createEmail).toHaveBeenCalledWith(
      jsonData.SailorEmail,
      expect.anything(),
    );
    expect(createClass).toHaveBeenCalledWith(
      jsonData.TracTracClass,
      expect.anything(),
    );
    expect(createRaceClass).toHaveBeenCalledWith(
      jsonData.TracTracRaceClass,
      expect.anything(),
    );
    expect(createEvent).toHaveBeenCalledWith(
      jsonData.TracTracEvent,
      expect.anything(),
    );
    expect(createRace).toHaveBeenCalledWith(
      jsonData.TracTracRace,
      expect.anything(),
    );
    expect(createCompetitor).toHaveBeenCalledWith(
      jsonData.TracTracCompetitor,
      expect.anything(),
    );
    expect(createCompetitorPassing).toHaveBeenCalledWith(
      jsonData.TracTracCompetitorPassing,
      expect.anything(),
    );
    expect(createCompetitorPosition).toHaveBeenCalledWith(
      jsonData.TracTracCompetitorPosition,
      expect.anything(),
    );
    expect(createCompetitorResult).toHaveBeenCalledWith(
      jsonData.TracTracCompetitorResult,
      expect.anything(),
    );
    expect(createControl).toHaveBeenCalledWith(
      jsonData.TracTracControl,
      expect.anything(),
    );
    expect(createControlPoint).toHaveBeenCalledWith(
      jsonData.TracTracControlPoint,
      expect.anything(),
    );
    expect(createControlPointPosition).toHaveBeenCalledWith(
      jsonData.TracTracControlPointPosition,
      expect.anything(),
    );
    expect(createRoute).toHaveBeenCalledWith(
      jsonData.TracTracRoute,
      expect.anything(),
    );
    expect(normalizeSpy).toHaveBeenCalledWith(jsonData, expect.anything());
    expect(axiosPostSpy).toHaveBeenCalledTimes(1);
  });
});

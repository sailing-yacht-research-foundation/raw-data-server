const db = require('../../models');
const saveTracTracData = require('../saveTracTracData');

const jsonData = require('../../test-files/tractrac.json');

describe('Storing trac trac data to DB', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
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
  it('should not save anything when empty data', async () => {
    const createEmail = jest.spyOn(db.sailorEmail, 'bulkCreate');
    const createClass = jest.spyOn(db.tractracClass, 'bulkCreate');
    const createRaceClass = jest.spyOn(db.tractracRaceClass, 'bulkCreate');
    const createEvent = jest.spyOn(db.tractracEvent, 'bulkCreate');
    const createRace = jest.spyOn(db.tractracRace, 'bulkCreate');
    const createCompetitor = jest.spyOn(db.tractracCompetitor, 'bulkCreate');
    const createCompetitorPassing = jest.spyOn(
      db.tractracCompetitorPassing,
      'bulkCreate',
    );
    const createCompetitorPosition = jest.spyOn(
      db.tractracCompetitorPosition,
      'bulkCreate',
    );
    const createCompetitorResult = jest.spyOn(
      db.tractracCompetitorResult,
      'bulkCreate',
    );
    const createControl = jest.spyOn(db.tractracControl, 'bulkCreate');
    const createControlPoint = jest.spyOn(
      db.tractracControlPoint,
      'bulkCreate',
    );
    const createControlPointPosition = jest.spyOn(
      db.tractracControlPointPosition,
      'bulkCreate',
    );
    const createRoute = jest.spyOn(db.tractracRoute, 'bulkCreate');
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
  });
  it('should save trac trac data correctly', async () => {
    const createEmail = jest.spyOn(db.sailorEmail, 'bulkCreate');
    const createClass = jest.spyOn(db.tractracClass, 'bulkCreate');
    const createRaceClass = jest.spyOn(db.tractracRaceClass, 'bulkCreate');
    const createEvent = jest.spyOn(db.tractracEvent, 'bulkCreate');
    const createRace = jest.spyOn(db.tractracRace, 'bulkCreate');
    const createCompetitor = jest.spyOn(db.tractracCompetitor, 'bulkCreate');
    const createCompetitorPassing = jest.spyOn(
      db.tractracCompetitorPassing,
      'bulkCreate',
    );
    const createCompetitorPosition = jest.spyOn(
      db.tractracCompetitorPosition,
      'bulkCreate',
    );
    const createCompetitorResult = jest.spyOn(
      db.tractracCompetitorResult,
      'bulkCreate',
    );
    const createControl = jest.spyOn(db.tractracControl, 'bulkCreate');
    const createControlPoint = jest.spyOn(
      db.tractracControlPoint,
      'bulkCreate',
    );
    const createControlPointPosition = jest.spyOn(
      db.tractracControlPointPosition,
      'bulkCreate',
    );
    const createRoute = jest.spyOn(db.tractracRoute, 'bulkCreate');
    await saveTracTracData(jsonData);
    expect(createEmail).toHaveBeenCalledTimes(1);
    expect(createClass).toHaveBeenCalledTimes(1);
    expect(createRaceClass).toHaveBeenCalledTimes(1);
    expect(createEvent).toHaveBeenCalledTimes(1);
    expect(createRace).toHaveBeenCalledTimes(1);
    expect(createCompetitor).toHaveBeenCalledTimes(1);
    expect(createCompetitorPassing).toHaveBeenCalledTimes(1);
    expect(createCompetitorPosition).toHaveBeenCalledTimes(1);
    expect(createCompetitorResult).toHaveBeenCalledTimes(1);
    expect(createControl).toHaveBeenCalledTimes(1);
    expect(createControlPoint).toHaveBeenCalledTimes(1);
    expect(createControlPointPosition).toHaveBeenCalledTimes(1);
    expect(createRoute).toHaveBeenCalledTimes(1);
  });
  it('should rollback data when one fails to execute', async () => {
    await db.tractracRace.destroy({ truncate: true });
    const initialRaceCount = 0;
    const invalidData = Object.assign({}, jsonData);
    invalidData.TracTracRace = [
      ...invalidData.TracTracRace,
      {
        original_id: '80b39da0-b465-0131-ba03-10bf48d758cd',
        url: 'https://live.tractrac.com/viewer/index.html?target=https://em.club.tractrac.com/events/c189feb0-9d3b-0131-d5a7-10bf48d758ce/races/80b39da0-b465-0131-ba03-10bf48d758cd.json',
      },
    ];
    const response = await saveTracTracData(invalidData);
    const raceCount = await db.tractracRace.count();
    expect(raceCount).toEqual(initialRaceCount);
    expect(response).toEqual(expect.stringContaining('notNull Violation'));
  });
});

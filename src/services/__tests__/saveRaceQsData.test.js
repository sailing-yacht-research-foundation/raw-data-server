const db = require('../../models');
const saveRaceQsData = require('../saveRaceQsData');

const jsonData = require('../../test-files/raceQs.json');

describe('Storing RaceQS data to DB', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
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
    await db.sequelize.close();
  });
  it('should not save anything when empty data', async () => {
    const createRegatta = jest.spyOn(db.raceQsRegatta, 'bulkCreate');
    const createEvent = jest.spyOn(db.raceQsEvent, 'bulkCreate');
    const createDivision = jest.spyOn(db.raceQsDivision, 'bulkCreate');
    const createParticipant = jest.spyOn(db.raceQsParticipant, 'bulkCreate');
    const createPosition = jest.spyOn(db.raceQsPosition, 'bulkCreate');
    const createRoute = jest.spyOn(db.raceQsRoute, 'bulkCreate');
    const createStart = jest.spyOn(db.raceQsStart, 'bulkCreate');
    const createWaypoint = jest.spyOn(db.raceQsWaypoint, 'bulkCreate');
    await saveRaceQsData({});
    expect(createRegatta).toHaveBeenCalledTimes(0);
    expect(createEvent).toHaveBeenCalledTimes(0);
    expect(createDivision).toHaveBeenCalledTimes(0);
    expect(createParticipant).toHaveBeenCalledTimes(0);
    expect(createPosition).toHaveBeenCalledTimes(0);
    expect(createRoute).toHaveBeenCalledTimes(0);
    expect(createStart).toHaveBeenCalledTimes(0);
    expect(createWaypoint).toHaveBeenCalledTimes(0);
  });
  it('should save data correctly', async () => {
    const createRegatta = jest.spyOn(db.raceQsRegatta, 'bulkCreate');
    const createEvent = jest.spyOn(db.raceQsEvent, 'bulkCreate');
    const createDivision = jest.spyOn(db.raceQsDivision, 'bulkCreate');
    const createParticipant = jest.spyOn(db.raceQsParticipant, 'bulkCreate');
    const createPosition = jest.spyOn(db.raceQsPosition, 'bulkCreate');
    const createRoute = jest.spyOn(db.raceQsRoute, 'bulkCreate');
    const createStart = jest.spyOn(db.raceQsStart, 'bulkCreate');
    const createWaypoint = jest.spyOn(db.raceQsWaypoint, 'bulkCreate');
    await saveRaceQsData(jsonData);
    expect(createRegatta).toHaveBeenCalledTimes(1);
    expect(createEvent).toHaveBeenCalledTimes(1);
    expect(createDivision).toHaveBeenCalledTimes(1);
    expect(createParticipant).toHaveBeenCalledTimes(1);
    expect(createPosition).toHaveBeenCalledTimes(1);
    expect(createRoute).toHaveBeenCalledTimes(1);
    expect(createStart).toHaveBeenCalledTimes(1);
    expect(createWaypoint).toHaveBeenCalledTimes(1);
  });
  it('should throw error when one fails to execute', async () => {
    const invalidData = Object.assign({}, jsonData);
    invalidData.RaceQsEvent = [
      ...invalidData.RaceQsEvent,
      {
        original_id: '62881',
        url: 'https://raceqs.com/tv-beta/tv.htm#eventId=62881',
      },
    ];
    const response = await saveRaceQsData(invalidData);
    expect(response).toEqual(expect.stringContaining('notNull Violation'));
  });
});

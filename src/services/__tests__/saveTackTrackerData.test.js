const db = require('../../models');
const saveTackTrackerData = require('../saveTackTrackerData');

const jsonData = require('../../test-files/tackTracker.json');

describe('Storing TackTracker data to DB', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
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
    await db.sequelize.close();
  });
  it('should not save anything when empty data', async () => {
    const createRegatta = jest.spyOn(db.tackTrackerRegatta, 'bulkCreate');
    const createRace = jest.spyOn(db.tackTrackerRace, 'bulkCreate');
    const createBoat = jest.spyOn(db.tackTrackerBoat, 'bulkCreate');
    const createDefault = jest.spyOn(db.tackTrackerDefault, 'bulkCreate');
    const createFinish = jest.spyOn(db.tackTrackerFinish, 'bulkCreate');
    const createMark = jest.spyOn(db.tackTrackerMark, 'bulkCreate');
    const createPosition = jest.spyOn(db.tackTrackerPosition, 'bulkCreate');
    const createStart = jest.spyOn(db.tackTrackerStart, 'bulkCreate');
    await saveTackTrackerData({});
    expect(createRegatta).toHaveBeenCalledTimes(0);
    expect(createRace).toHaveBeenCalledTimes(0);
    expect(createBoat).toHaveBeenCalledTimes(0);
    expect(createDefault).toHaveBeenCalledTimes(0);
    expect(createFinish).toHaveBeenCalledTimes(0);
    expect(createMark).toHaveBeenCalledTimes(0);
    expect(createPosition).toHaveBeenCalledTimes(0);
    expect(createStart).toHaveBeenCalledTimes(0);
  });
  it('should save data correctly', async () => {
    const createRegatta = jest.spyOn(db.tackTrackerRegatta, 'bulkCreate');
    const createRace = jest.spyOn(db.tackTrackerRace, 'bulkCreate');
    const createBoat = jest.spyOn(db.tackTrackerBoat, 'bulkCreate');
    const createDefault = jest.spyOn(db.tackTrackerDefault, 'bulkCreate');
    const createFinish = jest.spyOn(db.tackTrackerFinish, 'bulkCreate');
    const createMark = jest.spyOn(db.tackTrackerMark, 'bulkCreate');
    const createPosition = jest.spyOn(db.tackTrackerPosition, 'bulkCreate');
    const createStart = jest.spyOn(db.tackTrackerStart, 'bulkCreate');
    await saveTackTrackerData(jsonData);
    expect(createRegatta).toHaveBeenCalledTimes(1);
    expect(createRace).toHaveBeenCalledTimes(1);
    expect(createBoat).toHaveBeenCalledTimes(1);
    expect(createDefault).toHaveBeenCalledTimes(1);
    expect(createFinish).toHaveBeenCalledTimes(1);
    expect(createMark).toHaveBeenCalledTimes(1);
    expect(createPosition).toHaveBeenCalledTimes(1);
    expect(createStart).toHaveBeenCalledTimes(1);
  });
  it('should throw error when one fails to execute', async () => {
    const invalidData = Object.assign({}, jsonData);
    invalidData.TackTrackerRace = [
      ...invalidData.TackTrackerRace,
      {
        original_id: '8500587',
        url: 'https://tacktracker.com/cloud/regattas/show/asd',
      },
    ];
    const response = await saveTackTrackerData(invalidData);
    expect(response).toEqual(expect.stringContaining('notNull Violation'));
  });
});

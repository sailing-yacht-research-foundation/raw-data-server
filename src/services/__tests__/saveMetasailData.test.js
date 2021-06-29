const db = require('../../models');
const saveMetasailData = require('../saveMetasailData');

const jsonData = require('../../test-files/metasail.json');

describe('Storing Metasail data to DB', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
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
  it('should not save anything when empty data', async () => {
    const createEvent = jest.spyOn(db.raceQsEvent, 'bulkCreate');
    const createRace = jest.spyOn(db.metasailRace, 'bulkCreate');
    const createBoat = jest.spyOn(db.metasailBoat, 'bulkCreate');
    const createBuoy = jest.spyOn(db.metasailBuoy, 'bulkCreate');
    const createGate = jest.spyOn(db.metasailGate, 'bulkCreate');
    const createPosition = jest.spyOn(db.metasailPosition, 'bulkCreate');
    await saveMetasailData({});
    expect(createEvent).toHaveBeenCalledTimes(0);
    expect(createRace).toHaveBeenCalledTimes(0);
    expect(createBoat).toHaveBeenCalledTimes(0);
    expect(createPosition).toHaveBeenCalledTimes(0);
    expect(createBuoy).toHaveBeenCalledTimes(0);
    expect(createGate).toHaveBeenCalledTimes(0);
  });
  it('should save data correctly', async () => {
    const createEvent = jest.spyOn(db.metasailEvent, 'bulkCreate');
    const createRace = jest.spyOn(db.metasailRace, 'bulkCreate');
    const createBoat = jest.spyOn(db.metasailBoat, 'bulkCreate');
    const createBuoy = jest.spyOn(db.metasailBuoy, 'bulkCreate');
    const createGate = jest.spyOn(db.metasailGate, 'bulkCreate');
    const createPosition = jest.spyOn(db.metasailPosition, 'bulkCreate');
    await saveMetasailData(jsonData);
    expect(createEvent).toHaveBeenCalledTimes(1);
    expect(createRace).toHaveBeenCalledTimes(1);
    expect(createBoat).toHaveBeenCalledTimes(1);
    expect(createPosition).toHaveBeenCalledTimes(1);
    expect(createBuoy).toHaveBeenCalledTimes(1);
    expect(createGate).toHaveBeenCalledTimes(1);
  });
  it('should throw error when one fails to execute', async () => {
    const invalidData = Object.assign({}, jsonData);
    invalidData.MetasailRace = [
      ...invalidData.MetasailRace,
      {
        original_id: '10387',
        url: 'http://app.metasail.it/(S(bw42cieypqnejmnbfbuw1xmh))/ViewRecordedRace2018New.aspx?idgara=10387&token=5DUA',
      },
    ];
    const response = await saveMetasailData(invalidData);
    expect(response).toEqual(expect.stringContaining('notNull Violation'));
  });
});

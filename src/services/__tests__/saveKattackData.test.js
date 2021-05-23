const db = require('../../models');
const saveKattackData = require('../saveKattackData');

const jsonData = require('../../test-files/kattack.json');

describe('Storing kattack data to DB', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  afterAll(async () => {
    await db.kattackYachtClub.destroy({
      truncate: true,
    });
    await db.kattackRace.destroy({
      truncate: true,
    });
    await db.kattackDevice.destroy({
      truncate: true,
    });
    await db.kattackPosition.destroy({
      truncate: true,
    });
    await db.kattackWaypoint.destroy({
      truncate: true,
    });
    await db.sequelize.close();
  });
  it('should save kattack yacht club correctly', async () => {
    const spyCreate = jest.spyOn(db.kattackYachtClub, 'bulkCreate');
    const spyFindAll = jest.spyOn(db.kattackYachtClub, 'findAll');
    await saveKattackData({ KattackYachtClub: jsonData.KattackYachtClub });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  it('should save kattack races correctly', async () => {
    const spyCreate = jest.spyOn(db.kattackRace, 'bulkCreate');
    const spyFindAll = jest.spyOn(db.kattackRace, 'findAll');
    await saveKattackData({ KattackRace: jsonData.KattackRace });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  it('should save kattack devices correctly', async () => {
    const spyCreate = jest.spyOn(db.kattackDevice, 'bulkCreate');
    const spyFindAll = jest.spyOn(db.kattackDevice, 'findAll');
    await saveKattackData({ KattackDevice: jsonData.KattackDevice });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  it('should save kattack positions correctly', async () => {
    const spyCreate = jest.spyOn(db.kattackPosition, 'bulkCreate');
    const spyFindAll = jest.spyOn(db.kattackPosition, 'findAll');
    await saveKattackData({ KattackPosition: jsonData.KattackPosition });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  it('should save kattack waypoints correctly', async () => {
    const spyCreate = jest.spyOn(db.kattackWaypoint, 'bulkCreate');
    const spyFindAll = jest.spyOn(db.kattackWaypoint, 'findAll');
    await saveKattackData({ KattackWaypoint: jsonData.KattackWaypoint });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
});

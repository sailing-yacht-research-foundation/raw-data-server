const db = require('../../models');
const saveEstelaData = require('../saveEstelaData');

const jsonData = require('../../test-files/estela.json');

describe('Storing Estela data to DB', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  afterAll(async () => {
    await db.estelaBuoy.destroy({ truncate: true });
    await db.estelaClub.destroy({ truncate: true });
    await db.estelaDorsal.destroy({ truncate: true });
    await db.estelaPlayer.destroy({ truncate: true });
    await db.estelaPosition.destroy({ truncate: true });
    await db.estelaRace.destroy({ truncate: true });
    await db.estelaResult.destroy({ truncate: true });
    await db.estelaFailedUrl.destroy({ truncate: true });
    await db.estelaSuccessfulUrl.destroy({ truncate: true });
    await db.sequelize.close();
  });
  it('should not save anything when empty data', async () => {
    const createRace = jest.spyOn(db.estelaRace, 'bulkCreate');
    const createBuoy = jest.spyOn(db.estelaBuoy, 'bulkCreate');
    const createClub = jest.spyOn(db.estelaClub, 'bulkCreate');
    const createPosition = jest.spyOn(db.estelaPosition, 'bulkCreate');
    const createDorsal = jest.spyOn(db.estelaDorsal, 'bulkCreate');
    const createPlayer = jest.spyOn(db.estelaPlayer, 'bulkCreate');
    const createResult = jest.spyOn(db.estelaResult, 'bulkCreate');
    await saveEstelaData({});
    expect(createRace).toHaveBeenCalledTimes(0);
    expect(createBuoy).toHaveBeenCalledTimes(0);
    expect(createClub).toHaveBeenCalledTimes(0);
    expect(createPosition).toHaveBeenCalledTimes(0);
    expect(createDorsal).toHaveBeenCalledTimes(0);
    expect(createPlayer).toHaveBeenCalledTimes(0);
    expect(createResult).toHaveBeenCalledTimes(0);
  });
  it('should save data correctly', async () => {
    const createRace = jest.spyOn(db.estelaRace, 'create');
    const createBuoy = jest.spyOn(db.estelaBuoy, 'bulkCreate');
    const createClub = jest.spyOn(db.estelaClub, 'bulkCreate');
    const createPosition = jest.spyOn(db.estelaPosition, 'bulkCreate');
    const createDorsal = jest.spyOn(db.estelaDorsal, 'bulkCreate');
    const createPlayer = jest.spyOn(db.estelaPlayer, 'bulkCreate');
    const createResult = jest.spyOn(db.estelaResult, 'bulkCreate');
    await saveEstelaData(jsonData);
    expect(createRace).toHaveBeenCalledTimes(1);
    expect(createBuoy).toHaveBeenCalledTimes(1);
    expect(createClub).toHaveBeenCalledTimes(1);
    expect(createPosition).toHaveBeenCalledTimes(1);
    expect(createDorsal).toHaveBeenCalledTimes(1);
    expect(createPlayer).toHaveBeenCalledTimes(1);
    expect(createResult).toHaveBeenCalledTimes(1);
    await saveEstelaData(jsonData);
    expect(createRace).toHaveBeenCalledTimes(1);
  });
  it('should rollback data when one fails to execute', async () => {
    await db.estelaRace.destroy({ truncate: true });
    const initialRaceCount = 0;
    const invalidData = Object.assign({}, jsonData);
    invalidData.EstelaRace = {
      original_id: '6985',
      initLon: '3.1180188',
      initLat: '41.8491494',
      url: 'https://www.estela.co/en/tracking-race/6985/regata-diumenge-11-04-2021',
    };
    const response = await saveEstelaData(invalidData);
    const raceCount = await db.estelaRace.count();
    expect(raceCount).toEqual(initialRaceCount);
    expect(response).toEqual(expect.stringContaining('cannot be null'));
  });
});

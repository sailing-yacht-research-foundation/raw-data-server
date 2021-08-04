const db = require('../../models');
const normalizeObj = require('../normalization/normalizeEstela');
const normalizeSpy = jest
  .spyOn(normalizeObj, 'normalizeRace')
  .mockImplementation(() => Promise.resolve());
const saveEstelaData = require('../saveEstelaData');
const jsonData = require('../../test-files/estela.json');

describe('Storing Estela data to DB', () => {
  let createRace,
    createBuoy,
    createClub,
    createPosition,
    createDorsal,
    createPlayer,
    createResult;

  beforeAll(async () => {
    await db.sequelize.sync();
    createRace = jest.spyOn(db.estelaRace, 'bulkCreate');
    createBuoy = jest.spyOn(db.estelaBuoy, 'bulkCreate');
    createClub = jest.spyOn(db.estelaClub, 'bulkCreate');
    createPosition = jest.spyOn(db.estelaPosition, 'bulkCreate');
    createDorsal = jest.spyOn(db.estelaDorsal, 'bulkCreate');
    createPlayer = jest.spyOn(db.estelaPlayer, 'bulkCreate');
    createResult = jest.spyOn(db.estelaResult, 'bulkCreate');
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
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should not save anything when empty data', async () => {
    await saveEstelaData({});
    expect(createRace).toHaveBeenCalledTimes(0);
    expect(createBuoy).toHaveBeenCalledTimes(0);
    expect(createClub).toHaveBeenCalledTimes(0);
    expect(createPosition).toHaveBeenCalledTimes(0);
    expect(createDorsal).toHaveBeenCalledTimes(0);
    expect(createPlayer).toHaveBeenCalledTimes(0);
    expect(createResult).toHaveBeenCalledTimes(0);
    expect(normalizeSpy).toHaveBeenCalledTimes(0);
  });
  it('should save data correctly', async () => {
    await saveEstelaData(jsonData);
    expect(createRace).toHaveBeenCalledWith(
      jsonData.EstelaRace,
      expect.anything(),
    );
    expect(createBuoy).toHaveBeenCalledWith(
      jsonData.EstelaBuoy,
      expect.anything(),
    );
    expect(createClub).toHaveBeenCalledWith(
      jsonData.EstelaClub,
      expect.anything(),
    );
    expect(createPosition).toHaveBeenCalledWith(
      jsonData.EstelaPosition,
      expect.anything(),
    );
    expect(createDorsal).toHaveBeenCalledWith(
      jsonData.EstelaDorsal,
      expect.anything(),
    );
    expect(createPlayer).toHaveBeenCalledWith(
      jsonData.EstelaPlayer,
      expect.anything(),
    );
    expect(createResult).toHaveBeenCalledWith(
      jsonData.EstelaResult,
      expect.anything(),
    );
    expect(normalizeSpy).toHaveBeenCalledWith(jsonData, expect.anything());
  });
});

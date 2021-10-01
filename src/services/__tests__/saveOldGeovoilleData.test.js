const db = require('../../models');
const temp = require('temp');
const path = require('path');
const unzipFileUtil = require('../../utils/unzipFile');
const expectedRace = require('./../../test-files/old_geovoille/expectedRace.json');
const expectedRace2 = require('./../../test-files/old_geovoille/expectedRace2.json');
const saveOldGeovoilleData = require('../non-automatable/saveOldGeovoilleData');

jest.mock('../../utils/unzipFile');

describe('Storing SAP data to DB', () => {
  let createRace, createBoat, createBoatPosition;

  beforeAll(async () => {
    await db.sequelize.sync();
    jest
      .spyOn(temp, 'mkdirSync')
      .mockReturnValue(
        path.join(__dirname, '..', '..', 'test-files', 'old_geovoille'),
      );
    jest.spyOn(unzipFileUtil, 'downloadAndExtract').mockResolvedValue(true);

    createRace = jest.spyOn(db.oldGeovoilleRace, 'create');
    createBoat = jest.spyOn(db.oldGeovoilleBoat, 'create');
    createBoatPosition = jest.spyOn(db.oldGeovoilleBoatPosition, 'bulkCreate');
  });
  afterAll(async () => {
    await db.oldGeovoilleRace.destroy({ truncate: true });
    await db.oldGeovoilleBoat.destroy({ truncate: true });
    await db.oldGeovoilleBoatPosition.destroy({ truncate: true });
    jest.restoreAllMocks();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should save data correctly', async () => {
    await saveOldGeovoilleData('databacklog', 'old_geovoille_formated.zip');
    expect(createRace).toHaveBeenCalledWith(
      expect.objectContaining(expectedRace),
      expect.anything(),
    );
    expect(createRace).toHaveBeenCalledWith(
      expect.objectContaining(expectedRace2),
      expect.anything(),
    );
    expect(createRace).toHaveBeenCalledTimes(3);
    expect(createBoat).toHaveBeenCalledTimes(99);
    expect(createBoatPosition).toHaveBeenCalledTimes(99);
  });
});

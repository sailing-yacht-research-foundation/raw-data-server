const db = require('../../models');
const temp = require('temp');
const path = require('path');
const unzipFileUtil = require('../../utils/unzipFile');
const expectedRace = require('./../../test-files/old_geovoile/expectedRace.json');
const expectedRace2 = require('./../../test-files/old_geovoile/expectedRace2.json');
const saveOldGeovoileData = require('../non-automatable/saveOldGeovoileData');

jest.mock('../../utils/unzipFile');

describe('Storing old geovoile data to DB', () => {
  let createRace, createBoat, createBoatPosition;

  beforeAll(async () => {
    await db.sequelize.sync();
    jest
      .spyOn(temp, 'mkdirSync')
      .mockReturnValue(
        path.join(__dirname, '..', '..', 'test-files', 'old_geovoile'),
      );
    jest.spyOn(unzipFileUtil, 'downloadAndExtract').mockResolvedValue(true);

    createRace = jest.spyOn(db.oldGeovoileRace, 'create');
    createBoat = jest.spyOn(db.oldGeovoileBoat, 'create');
    createBoatPosition = jest.spyOn(db.oldGeovoileBoatPosition, 'bulkCreate');
  });
  afterAll(async () => {
    await db.oldGeovoileRace.destroy({ truncate: true });
    await db.oldGeovoileBoat.destroy({ truncate: true });
    await db.oldGeovoileBoatPosition.destroy({ truncate: true });
    jest.restoreAllMocks();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should save data correctly', async () => {
    await saveOldGeovoileData('databacklog', 'old_geovoile_formated.zip');
    expect(createRace).toHaveBeenCalledWith(
      expect.objectContaining(expectedRace),
      expect.anything(),
    );
    expect(createRace).toHaveBeenCalledWith(
      expect.objectContaining(expectedRace2),
      expect.anything(),
    );
    expect(createRace).toHaveBeenCalledTimes(3);
    expect(createBoat).toHaveBeenCalledTimes(93);
    expect(createBoatPosition).toHaveBeenCalledTimes(93);
  });
});

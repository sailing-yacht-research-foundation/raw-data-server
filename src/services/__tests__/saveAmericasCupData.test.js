const temp = require('temp');
const path = require('path');
const db = require('../../models');
const saveAmericasCupData = require('../non-automatable/saveAmericasCupData');
const { AMERICAS_CUP_TABLE_SUFFIX } = require('../../constants');
const unzipFileUtil = require('../../utils/unzipFile');
const { normalizeRace } = require('../normalization/non-automatable/normalizeAmericascup');

jest.mock('../../utils/unzipFile');
jest.mock('../normalization/non-automatable/normalizeAmericascup', () => ({
  normalizeRace: jest.fn().mockResolvedValue({ id: '123' }),
}));

describe('Storing AmericasCup to DB', () => {
  const dirNames = ['americasCup2013', 'americasCup2016'];
  beforeAll(async () => {
    await db.sequelize.sync();
    jest.spyOn(unzipFileUtil, 'downloadAndExtract').mockResolvedValue(true);
  });
  afterAll(async () => {
    for (key of AMERICAS_CUP_TABLE_SUFFIX) {
      await db[`americasCup${key}`].destroy({ truncate: true });
    }
    await db.sequelize.close();
    jest.restoreAllMocks();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe.each(dirNames)('When using %s data', (dirName) => {
    const bulkCreateSpies = {};
    beforeAll(async () => {
      jest.spyOn(temp, 'mkdirSync').mockReturnValue(path.join(__dirname, '..', '..', 'test-files', dirName));

      for (key of AMERICAS_CUP_TABLE_SUFFIX) {
        const spy = jest.spyOn(db[`americasCup${key}`], 'bulkCreate');
        bulkCreateSpies[key] = spy;
      }
    });

    it('should save data correctly', async () => {
      const expectedJson1 = require(`../../test-files/${dirName}/objectsToSave_1.json`);
      await saveAmericasCupData('bucketName', 'fileName', dirName);
      for (key of Object.keys(bulkCreateSpies)) {
        const dataKey = 'AmericasCup' + key[0].toUpperCase() + key.slice(1);
        const passedData = expectedJson1[dataKey];
        if (passedData) {
          let expectedObject;
          if (passedData instanceof Array) {
            expectedObject = passedData.map((o) => expect.objectContaining(o));
          } else {
            expectedObject = [expect.objectContaining(passedData)];
          }
          expect(bulkCreateSpies[key]).toHaveBeenCalledWith(
            expectedObject,
            expect.anything(),
          );
          // The 4 keys here are saved on each race.xml file plus the regatta. Since we have 2 files, it should be saved twice.
          let expectedCallTimes = ['Race', 'CompoundMark', 'Mark', 'CourseLimit', 'Regatta'].includes(key) ? 2 : 1;
          expect(bulkCreateSpies[key]).toHaveBeenCalledTimes(expectedCallTimes);
        }
        expect(normalizeRace).toHaveBeenCalledTimes(1);
      }
    });
  });
});

const temp = require('temp');
const path = require('path');
const db = require('../../models');
const saveAmericasCup2016Data = require('../non-automatable/saveAmericasCup2016Data');
const { AMERICAS_CUP_TABLE_SUFFIX } = require('../../constants');
const unzipFileUtil = require('../../utils/unzipFile');
const expectedJson1 = require('../../test-files/americasCup2016/objectsToSave_1.json');
const expectedJson2 = require('../../test-files/americasCup2016/objectsToSave_2.json');

jest.mock('../../utils/unzipFile');

describe('Storing AmericasCup2016 data to DB', () => {
  const bulkCreateSpies = {};

  beforeAll(async () => {
    await db.sequelize.sync();
    jest.spyOn(temp, 'mkdirSync').mockReturnValue(path.join(__dirname, '..', '..', 'test-files', 'americasCup2016'));
    jest.spyOn(unzipFileUtil, 'downloadAndExtract').mockResolvedValue(true);

    for (key of AMERICAS_CUP_TABLE_SUFFIX) {
      const spy = jest.spyOn(db[`americascup${key}`], 'bulkCreate');
      bulkCreateSpies[key] = spy;
    }
  });
  afterAll(async () => {
    for (key of AMERICAS_CUP_TABLE_SUFFIX) {
      await db[`americascup${key}`].destroy({ truncate: true });
    }
    await db.sequelize.close();
    jest.restoreAllMocks();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should save data correctly', async () => {
    await saveAmericasCup2016Data('bucketName', 'fileName');
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
      }

      const passedData2 = expectedJson2[dataKey];
      if (passedData2) {
        expect(bulkCreateSpies[key]).toHaveBeenCalledWith(
          passedData2.map((o) => expect.objectContaining(o)),
          expect.anything(),
        );
      }
    }
  });
});

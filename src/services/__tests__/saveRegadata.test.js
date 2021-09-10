const db = require('../../models');
const saveRegadata = require('../non-automatable/saveRegadata/saveRegadata');
const temp = require('temp');
const path = require('path');
const unzipFileUtil = require('../../utils/unzipFile');
const expectedRace = require('../../test-files/regadata/data/expectedRace.json');

jest.mock('../../utils/unzipFile');

describe('Storing SAP data to DB', () => {
  let createRegadataRace, createRegadataReport, createRegadataSail;

  beforeAll(async () => {
    await db.sequelize.sync();
    jest
      .spyOn(temp, 'mkdirSync')
      .mockReturnValue(
        path.join(__dirname, '..', '..', 'test-files', 'regadata'),
      );
    jest.spyOn(unzipFileUtil, 'downloadAndExtractTar').mockResolvedValue(true);

    createRegadataRace = jest.spyOn(db.regadataRace, 'create');
    createRegadataSail = jest.spyOn(db.regadataSail, 'bulkCreate');
    createRegadataReport = jest.spyOn(db.regadataReport, 'bulkCreate');
  });
  afterAll(async () => {
    await db.regadataSail.destroy({ truncate: true });
    await db.regadataReport.destroy({ truncate: true });
    await db.regadataRace.destroy({ truncate: true });
    await db.sequelize.close();
    jest.restoreAllMocks();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should save data correctly', async () => {
    await saveRegadata('databacklog', 'regadata.tar.gz');

    // the call will contain 2 argument
    // arg1: created object, which has id and original_id. The expectedRace has only original_id. This is a partial match
    // arg2: sequelize transaction, so we can expect anything in here,
    // if you want to expect more detail, you an mock transaction object and commit id as well.
    expect(createRegadataRace).toHaveBeenCalledWith(
      expect.objectContaining(expectedRace),
      expect.anything(),
    );

    expect(createRegadataRace).toHaveBeenCalledTimes(1);
    expect(createRegadataSail).toHaveBeenCalledTimes(1);
    expect(createRegadataReport).toHaveBeenCalledTimes(1);
  });
});

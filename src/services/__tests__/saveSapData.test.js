const db = require('../../models');
const saveSapData = require('../non-automatable/saveSapData');
const temp = require('temp');
const path = require('path');
const unzipFileUtil = require('../../utils/unzipFile');
const expectedRace = require('./../../test-files/sap/data/expectedRace.json');

jest.mock('../../utils/unzipFile');

describe('Storing SAP data to DB', () => {
  let createCompetitor,
    createCompetitorBoat,
    createCompetitorBoatPosition,
    createCompetitorLeg,
    createCompetitorManeuver,
    createCompetitorMarkPassing,
    createCompetitorMarkPositon,
    createCourse,
    createRace,
    createTargetTimeLeg,
    createWindSummary;

  beforeAll(async () => {
    await db.sequelize.sync();
    jest
      .spyOn(temp, 'mkdirSync')
      .mockReturnValue(path.join(__dirname, '..', '..', 'test-files', 'sap'));
    jest.spyOn(unzipFileUtil, 'downloadAndExtract').mockResolvedValue(true);

    createRace = jest.spyOn(db.sapRace, 'create');
    createCompetitor = jest.spyOn(db.sapCompetitor, 'bulkCreate');
    createCompetitorBoat = jest.spyOn(db.sapCompetitorBoat, 'bulkCreate');
    createCompetitorBoatPosition = jest.spyOn(
      db.sapCompetitorBoatPosition,
      'bulkCreate',
    );
    createCompetitorLeg = jest.spyOn(db.sapCompetitorLeg, 'bulkCreate');
    createCompetitorManeuver = jest.spyOn(
      db.sapCompetitorManeuver,
      'bulkCreate',
    );
    createCompetitorMarkPassing = jest.spyOn(
      db.sapCompetitorMarkPassing,
      'bulkCreate',
    );
    createCompetitorMarkPositon = jest.spyOn(
      db.sapCompetitorMarkPosition,
      'bulkCreate',
    );
    createCourse = jest.spyOn(db.sapCourse, 'bulkCreate');
    createTargetTimeLeg = jest.spyOn(db.sapTargetTimeLeg, 'bulkCreate');
    createWindSummary = jest.spyOn(db.sapWindSummary, 'bulkCreate');
  });
  afterAll(async () => {
    await db.sapRace.destroy({ truncate: true });
    await db.sapCompetitor.destroy({ truncate: true });
    await db.sapCompetitorBoat.destroy({ truncate: true });
    await db.sapCompetitorBoatPosition.destroy({ truncate: true });
    await db.sapCompetitorLeg.destroy({ truncate: true });
    await db.sapCompetitorManeuver.destroy({ truncate: true });
    await db.sapCompetitorMarkPassing.destroy({ truncate: true });
    await db.sapCompetitorMarkPosition.destroy({ truncate: true });
    await db.sapCourse.destroy({ truncate: true });
    await db.sapTargetTimeLeg.destroy({ truncate: true });
    await db.sapWindSummary.destroy({ truncate: true });
    await db.sequelize.close();
    jest.restoreAllMocks();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should save data correctly', async () => {
    await saveSapData('databacklog', 'SAP-TEST.zip');
    expect(createRace).toHaveBeenCalledWith(
      expect.objectContaining(expectedRace),
      expect.anything(),
    );
    expect(createRace).toHaveBeenCalledTimes(1);
    expect(createCompetitor).toHaveBeenCalledTimes(1);
    expect(createCompetitorBoat).toHaveBeenCalledTimes(1);
    expect(createCompetitorBoatPosition).toHaveBeenCalledTimes(1);
    expect(createCompetitorLeg).toHaveBeenCalledTimes(1);
    expect(createCompetitorManeuver).toHaveBeenCalledTimes(1);
    expect(createCompetitorMarkPassing).toHaveBeenCalledTimes(1);
    expect(createCompetitorMarkPositon).toHaveBeenCalledTimes(1);
    expect(createCourse).toHaveBeenCalledTimes(1);
    expect(createRace).toHaveBeenCalledTimes(1);
    expect(createTargetTimeLeg).toHaveBeenCalledTimes(1);
    expect(createWindSummary).toHaveBeenCalledTimes(1);
  });
});

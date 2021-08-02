const db = require('../../models');
const saveTackTrackerData = require('../saveTackTrackerData');
const s3Util = require('../uploadFileToS3');

const jsonData = require('../../test-files/tackTracker.json');

jest.mock('../uploadFileToS3', () => ({
  uploadGeoJsonToS3: jest.fn(),
}));
jest.mock('../../utils/elasticsearch', () => ({
  indexRace: jest.fn(),
}));
jest.setTimeout(60000);
describe('Storing TackTracker data to DB', () => {
  beforeAll(async () => {
    await db.tackTrackerRegatta.sync({ force: true });
    await db.tackTrackerRace.sync({ force: true });
    await db.tackTrackerBoat.sync({ force: true });
    await db.tackTrackerDefault.sync({ force: true });
    await db.tackTrackerFinish.sync({ force: true });
    await db.tackTrackerMark.sync({ force: true });
    await db.tackTrackerPosition.sync({ force: true });
    await db.tackTrackerStart.sync({ force: true });
    await db.tackTrackerFailedUrl.sync({ force: true });
    await db.tackTrackerSuccessfulUrl.sync({ force: true });
    await db.readyAboutRaceMetadata.sync({ force: true });
    await db.readyAboutTrackGeoJsonLookup.sync({ force: true });
  });
  afterAll(async () => {
    await db.tackTrackerRegatta.destroy({ truncate: true });
    await db.tackTrackerRace.destroy({ truncate: true });
    await db.tackTrackerBoat.destroy({ truncate: true });
    await db.tackTrackerDefault.destroy({ truncate: true });
    await db.tackTrackerFinish.destroy({ truncate: true });
    await db.tackTrackerMark.destroy({ truncate: true });
    await db.tackTrackerPosition.destroy({ truncate: true });
    await db.tackTrackerStart.destroy({ truncate: true });
    await db.tackTrackerFailedUrl.destroy({ truncate: true });
    await db.tackTrackerSuccessfulUrl.destroy({ truncate: true });
    await db.readyAboutRaceMetadata.destroy({ truncate: true });
    await db.readyAboutTrackGeoJsonLookup.destroy({ truncate: true });
    await db.sequelize.close();
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should not save anything when empty data', async () => {
    const createRegatta = jest.spyOn(db.tackTrackerRegatta, 'bulkCreate');
    const createRace = jest.spyOn(db.tackTrackerRace, 'bulkCreate');
    const createBoat = jest.spyOn(db.tackTrackerBoat, 'bulkCreate');
    const createDefault = jest.spyOn(db.tackTrackerDefault, 'bulkCreate');
    const createFinish = jest.spyOn(db.tackTrackerFinish, 'bulkCreate');
    const createMark = jest.spyOn(db.tackTrackerMark, 'bulkCreate');
    const createPosition = jest.spyOn(db.tackTrackerPosition, 'bulkCreate');
    const createStart = jest.spyOn(db.tackTrackerStart, 'bulkCreate');
    await saveTackTrackerData({});
    expect(createRegatta).toHaveBeenCalledTimes(0);
    expect(createRace).toHaveBeenCalledTimes(0);
    expect(createBoat).toHaveBeenCalledTimes(0);
    expect(createDefault).toHaveBeenCalledTimes(0);
    expect(createFinish).toHaveBeenCalledTimes(0);
    expect(createMark).toHaveBeenCalledTimes(0);
    expect(createPosition).toHaveBeenCalledTimes(0);
    expect(createStart).toHaveBeenCalledTimes(0);
  });
  it('should save data correctly', async () => {
    const createRegatta = jest.spyOn(db.tackTrackerRegatta, 'bulkCreate');
    const createRace = jest.spyOn(db.tackTrackerRace, 'bulkCreate');
    const createBoat = jest.spyOn(db.tackTrackerBoat, 'bulkCreate');
    const createDefault = jest.spyOn(db.tackTrackerDefault, 'bulkCreate');
    const createFinish = jest.spyOn(db.tackTrackerFinish, 'bulkCreate');
    const createMark = jest.spyOn(db.tackTrackerMark, 'bulkCreate');
    const createPosition = jest.spyOn(db.tackTrackerPosition, 'bulkCreate');
    const createStart = jest.spyOn(db.tackTrackerStart, 'bulkCreate');
    const uploadS3Spy = jest.spyOn(s3Util, 'uploadGeoJsonToS3');

    await saveTackTrackerData(jsonData);
    expect(createRegatta).toHaveBeenCalledTimes(1);
    expect(createRace).toHaveBeenCalledTimes(1);
    expect(createBoat).toHaveBeenCalledTimes(1);
    expect(createDefault).toHaveBeenCalledTimes(1);
    expect(createFinish).toHaveBeenCalledTimes(1);
    expect(createMark).toHaveBeenCalledTimes(1);
    expect(createPosition).toHaveBeenCalledTimes(1);
    expect(createStart).toHaveBeenCalledTimes(1);
    expect(uploadS3Spy).toHaveBeenCalledTimes(1);
  });
});

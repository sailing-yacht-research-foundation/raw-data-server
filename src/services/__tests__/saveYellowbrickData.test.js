const db = require('../../models');
const saveYellowbrickData = require('../saveYellowbrickData');
const s3Util = require('../uploadFileToS3');

const jsonData = require('../../test-files/yellowbrick.json');

jest.mock('../uploadFileToS3', () => ({
  uploadGeoJsonToS3: jest.fn(),
  uploadDataToS3: jest.fn(),
}));
jest.mock('../../utils/elasticsearch', () => ({
  indexRace: jest.fn(),
}));
jest.setTimeout(60000);
describe('Storing yellowbrick data to DB', () => {
  beforeAll(async () => {
    await db.yellowbrickRace.sync({ force: true });
    await db.yellowbrickCourseNode.sync({ force: true });
    await db.yellowbrickLeaderboardTeam.sync({ force: true });
    await db.yellowbrickPoi.sync({ force: true });
    await db.yellowbrickPosition.sync({ force: true });
    await db.yellowbrickTag.sync({ force: true });
    await db.yellowbrickTeam.sync({ force: true });
    await db.yellowbrickSuccessfulUrl.sync({ force: true });
    await db.yellowbrickFailedUrl.sync({ force: true });
    await db.readyAboutRaceMetadata.sync({ force: true });
    await db.readyAboutTrackGeoJsonLookup.sync({ force: true });
  });
  afterAll(async () => {
    await db.yellowbrickRace.destroy({ truncate: true });
    await db.yellowbrickCourseNode.destroy({ truncate: true });
    await db.yellowbrickLeaderboardTeam.destroy({ truncate: true });
    await db.yellowbrickPoi.destroy({ truncate: true });
    await db.yellowbrickPosition.destroy({ truncate: true });
    await db.yellowbrickTag.destroy({ truncate: true });
    await db.yellowbrickTeam.destroy({ truncate: true });
    await db.yellowbrickSuccessfulUrl.destroy({ truncate: true });
    await db.yellowbrickFailedUrl.destroy({ truncate: true });
    await db.readyAboutRaceMetadata.destroy({ truncate: true });
    await db.readyAboutTrackGeoJsonLookup.destroy({ truncate: true });
    await db.sequelize.close();
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should not save anything when empty data', async () => {
    const createRace = jest.spyOn(db.yellowbrickRace, 'bulkCreate');
    const createCourseNode = jest.spyOn(db.yellowbrickCourseNode, 'bulkCreate');
    const createLeaderboardTeam = jest.spyOn(
      db.yellowbrickLeaderboardTeam,
      'bulkCreate',
    );
    const createPoi = jest.spyOn(db.yellowbrickPoi, 'bulkCreate');
    const createPosition = jest.spyOn(db.yellowbrickPosition, 'bulkCreate');
    const createTag = jest.spyOn(db.yellowbrickTag, 'bulkCreate');
    const createTeam = jest.spyOn(db.yellowbrickTeam, 'bulkCreate');
    await saveYellowbrickData({});
    expect(createRace).toHaveBeenCalledTimes(0);
    expect(createCourseNode).toHaveBeenCalledTimes(0);
    expect(createLeaderboardTeam).toHaveBeenCalledTimes(0);
    expect(createPoi).toHaveBeenCalledTimes(0);
    expect(createPosition).toHaveBeenCalledTimes(0);
    expect(createTag).toHaveBeenCalledTimes(0);
    expect(createTeam).toHaveBeenCalledTimes(0);
  });
  it('should save data correctly', async () => {
    const createRace = jest.spyOn(db.yellowbrickRace, 'bulkCreate');
    const createCourseNode = jest.spyOn(db.yellowbrickCourseNode, 'bulkCreate');
    const createLeaderboardTeam = jest.spyOn(
      db.yellowbrickLeaderboardTeam,
      'bulkCreate',
    );
    const createPoi = jest.spyOn(db.yellowbrickPoi, 'bulkCreate');
    const createPosition = jest.spyOn(db.yellowbrickPosition, 'bulkCreate');
    const createTag = jest.spyOn(db.yellowbrickTag, 'bulkCreate');
    const createTeam = jest.spyOn(db.yellowbrickTeam, 'bulkCreate');
    const uploadS3Spy = jest.spyOn(s3Util, 'uploadDataToS3');

    await saveYellowbrickData(jsonData);
    expect(createRace).toHaveBeenCalledTimes(1);
    expect(createCourseNode).toHaveBeenCalledTimes(1);
    expect(createLeaderboardTeam).toHaveBeenCalledTimes(1);
    expect(createPoi).toHaveBeenCalledTimes(1);
    expect(createPosition).toHaveBeenCalledTimes(1);
    expect(createTag).toHaveBeenCalledTimes(1);
    expect(createTeam).toHaveBeenCalledTimes(1);
    expect(uploadS3Spy).toHaveBeenCalledTimes(1);
  });
});

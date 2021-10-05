const db = require('../../models');
const {
  getRaces,
  getTeams,
  getTags,
  getCourseNodes,
  getLeaderboardTeams,
  getPois,
  processYellowbrickData,
} = require('../processYellowbrickData');
const normalizeObj = require('../normalization/normalizeYellowbrick');
jest
  .spyOn(normalizeObj, 'normalizeRace')
  .mockImplementation(() => Promise.resolve());
const saveYellowbrickData = require('../saveYellowbrickData');
const uploadUtil = require('../uploadUtil');
const jsonData = require('../../test-files/yellowbrick.json');

describe('Processing non-existent Yellowbrick Data from DB to Parquet', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  it('should not get any races', async () => {
    const races = await getRaces();
    expect(races.length).toEqual(0);
  });

  it('should fetch data from db, and return empty string for url', async () => {
    const fileUrl = await processYellowbrickData();
    expect(fileUrl).toEqual('');
  });
});

describe('Processing exist Yellowbrick Data from DB to Parquet', () => {
  const raceID1 = jsonData.YellowbrickRace[0].id;;
  beforeAll(async () => {
    await saveYellowbrickData(jsonData);
  });
  afterAll(async () => {
    jest.resetAllMocks();
    await db.yellowbrickRace.destroy({ truncate: true });
    await db.yellowbrickPosition.destroy({ truncate: true });
    await db.yellowbrickPoi.destroy({ truncate: true });
    await db.yellowbrickCourseNode.destroy({ truncate: true });
    await db.yellowbrickLeaderboardTeam.destroy({ truncate: true });
    await db.yellowbrickTag.destroy({ truncate: true });
    await db.yellowbrickTeam.destroy({ truncate: true });
    await db.yellowbrickSuccessfulUrl.destroy({ truncate: true });
    await db.yellowbrickFailedUrl.destroy({ truncate: true });
    await db.sequelize.close();
  });
  it('should get races', async () => {
    const races = await getRaces();
    expect(races.length).toEqual(1);
  });
  it('should get teams', async () => {
    const case1 = await getTeams([raceID1]);
    const expectedLength = jsonData.YellowbrickTeam.filter((p) => p.race === raceID1).length;
    expect(case1.size).toEqual(1);
    expect(case1.get(raceID1).length).toEqual(expectedLength);
  });
  it('should get tags', async () => {
    const case1 = await getTags([raceID1]);
    const expectedLength = jsonData.YellowbrickTag.filter((p) => p.race === raceID1).length;
    expect(case1.size).toEqual(1);
    expect(case1.get(raceID1).length).toEqual(expectedLength);
  });
  it('should get pois', async () => {
    const case1 = await getPois([raceID1]);
    const expectedLength = jsonData.YellowbrickPoi.filter((p) => p.race === raceID1).length;
    expect(case1.size).toEqual(1);
    expect(case1.get(raceID1).length).toEqual(expectedLength);
  });
  it('should get leaderboard teams', async () => {
    const case1 = await getLeaderboardTeams([raceID1]);
    const expectedLength = jsonData.YellowbrickLeaderboardTeam.filter((p) => p.race === raceID1).length;
    expect(case1.size).toEqual(1);
    expect(case1.get(raceID1).length).toEqual(expectedLength);
  });
  it('should get course nodes', async () => {
    const case1 = await getCourseNodes([raceID1]);
    const expectedLength = jsonData.YellowbrickCourseNode.filter((p) => p.race === raceID1).length;
    expect(case1.size).toEqual(expectedLength);
  });

  it('should fetch data from db, save a parquet file, and calls upload to s3', async () => {
    const mockS3UploadResultPath = {
      mainUrl: 'https://awsbucket.com/thebucket/yellowbrick/main.parquet',
      positionUrl:
        'https://awsbucket.com/thebucket/yellowbrick/position.parquet',
    };
    const uploadSpy = jest.spyOn(uploadUtil, 'uploadFileToS3')
      .mockResolvedValueOnce(mockS3UploadResultPath.mainUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.positionUrl);

    const fileUrl = await processYellowbrickData();
    expect(uploadSpy).toHaveBeenCalledTimes(2);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });
});

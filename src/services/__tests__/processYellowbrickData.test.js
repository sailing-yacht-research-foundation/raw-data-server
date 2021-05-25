const db = require('../../models');
const {
  getRaces,
  getTeams,
  getTags,
  getCourseNodes,
  getLeaderboardTeams,
  getPois,
  getPositions,
  processYellowbrickData,
} = require('../processYellowbrickData');
const saveYellowbrickData = require('../saveYellowbrickData');
const writeToParquet = require('../writeToParquet');
const uploadFileToS3 = require('../uploadFileToS3');
const jsonData = require('../../test-files/yellowbrick.json');

jest.mock('../writeToParquet', () => jest.fn());
jest.mock('../uploadFileToS3', () => jest.fn());

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
  const raceID1 = 'e64453b5-4e1f-4ffe-9cdd-3fd1cdea49fd';
  const raceID2 = 'ed7412dc-92f0-4e52-8f72-6ba4589bd7bb';
  const raceID3 = '4ae1af86-b76e-41ce-90a3-8c08b3d874b4';
  beforeAll(async () => {
    await saveYellowbrickData(jsonData);
  });
  afterAll(async () => {
    jest.resetAllMocks();
    await db.yellowbrickRace.destroy({
      truncate: true,
    });
    await db.yellowbrickPosition.destroy({
      truncate: true,
    });
    await db.yellowbrickPoi.destroy({
      truncate: true,
    });
    await db.yellowbrickCourseNode.destroy({
      truncate: true,
    });
    await db.yellowbrickLeaderboardTeam.destroy({
      truncate: true,
    });
    await db.yellowbrickTag.destroy({
      truncate: true,
    });
    await db.yellowbrickTeam.destroy({
      truncate: true,
    });
    await db.sequelize.close();
  });
  it('should get races', async () => {
    const races = await getRaces();
    expect(races.length).toEqual(3);
  });
  it('should get teams', async () => {
    const case1 = await getTeams([raceID1, raceID2]);
    expect(case1.size).toEqual(1);
    expect(case1.get(raceID1).length).toEqual(2);
    const case2 = await getTeams([raceID3]);
    expect(case2.size).toEqual(1);
    expect(case2.get(raceID3).length).toEqual(1);
  });
  it('should get tags', async () => {
    const case1 = await getTags([raceID1, raceID2]);
    expect(case1.size).toEqual(2);
    expect(case1.get(raceID1).length).toEqual(2);
    const case2 = await getTags([raceID3]);
    expect(case2.size).toEqual(0);
  });
  it('should get positions', async () => {
    const case1 = await getPositions([raceID1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(raceID1).length).toEqual(3);
    const case2 = await getPositions([raceID2, raceID3]);
    expect(case2.size).toEqual(0);
  });
  it('should get pois', async () => {
    const case1 = await getPois([raceID1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(raceID1).length).toEqual(1);

    const case2 = await getPois([raceID2, raceID3]);
    expect(case2.size).toEqual(0);
  });
  it('should get leaderboard teams', async () => {
    const case1 = await getLeaderboardTeams([raceID1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(raceID1).length).toEqual(2);

    const case2 = await getLeaderboardTeams([raceID2, raceID3]);
    expect(case2.size).toEqual(0);
  });
  it('should get course nodes', async () => {
    const case1 = await getCourseNodes([raceID1]);
    expect(case1.size).toEqual(1);

    const case2 = await getCourseNodes([raceID2]);
    expect(case2.size).toEqual(1);

    const case3 = await getCourseNodes([raceID3]);
    expect(case3.size).toEqual(0);
  });

  it('should fetch data from db, save a parquet file, and calls upload to s3', async () => {
    const mockS3UploadResultPath =
      'https://awsbucket.com/thebucket/yellowbrick/result.parquet';
    uploadFileToS3.mockResolvedValueOnce(mockS3UploadResultPath);

    const fileUrl = await processYellowbrickData();
    expect(uploadFileToS3).toHaveBeenCalledTimes(1);
    expect(writeToParquet).toHaveBeenCalledTimes(1);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });
});

const db = require('../../models');
const saveYellowbrickData = require('../saveYellowbrickData');

const jsonData = require('../../test-files/yellowbrick.json');

describe('Storing yellowbrick data to DB', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
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
    await db.sequelize.close();
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
    await saveYellowbrickData(jsonData);
    expect(createRace).toHaveBeenCalledTimes(1);
    expect(createCourseNode).toHaveBeenCalledTimes(1);
    expect(createLeaderboardTeam).toHaveBeenCalledTimes(1);
    expect(createPoi).toHaveBeenCalledTimes(1);
    expect(createPosition).toHaveBeenCalledTimes(1);
    expect(createTag).toHaveBeenCalledTimes(1);
    expect(createTeam).toHaveBeenCalledTimes(1);
  });
});

const axios = require('axios');
const db = require('../../models');
const normalizeObj = require('../normalization/normalizeYellowbrick');
const normalizeSpy = jest
  .spyOn(normalizeObj, 'normalizeRace')
  .mockImplementation(() => Promise.resolve({ id: '123' }));
const saveYellowbrickData = require('../saveYellowbrickData');
const jsonData = require('../../test-files/yellowbrick.json');

describe('Storing yellowbrick data to DB', () => {
  let createRace,
    createCourseNode,
    createLeaderboardTeam,
    createPoi,
    createPosition,
    createTag,
    createTeam,
    axiosPostSpy;

  beforeAll(async () => {
    await db.sequelize.sync();
    createRace = jest.spyOn(db.yellowbrickRace, 'bulkCreate');
    createCourseNode = jest.spyOn(db.yellowbrickCourseNode, 'bulkCreate');
    createLeaderboardTeam = jest.spyOn(
      db.yellowbrickLeaderboardTeam,
      'bulkCreate',
    );
    createPoi = jest.spyOn(db.yellowbrickPoi, 'bulkCreate');
    createPosition = jest.spyOn(db.yellowbrickPosition, 'bulkCreate');
    createTag = jest.spyOn(db.yellowbrickTag, 'bulkCreate');
    createTeam = jest.spyOn(db.yellowbrickTeam, 'bulkCreate');
    axiosPostSpy = jest
      .spyOn(axios, 'post')
      .mockImplementation(() => Promise.resolve());
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
    jest.clearAllMocks();
  });

  it('should not save anything when empty data', async () => {
    await saveYellowbrickData({});
    expect(createRace).toHaveBeenCalledTimes(0);
    expect(createCourseNode).toHaveBeenCalledTimes(0);
    expect(createLeaderboardTeam).toHaveBeenCalledTimes(0);
    expect(createPoi).toHaveBeenCalledTimes(0);
    expect(createPosition).toHaveBeenCalledTimes(0);
    expect(createTag).toHaveBeenCalledTimes(0);
    expect(createTeam).toHaveBeenCalledTimes(0);
    expect(normalizeSpy).toHaveBeenCalledTimes(0);
    expect(axiosPostSpy).toHaveBeenCalledTimes(0);
  });
  it('should save data correctly', async () => {
    await saveYellowbrickData(jsonData);
    expect(createRace).toHaveBeenCalledWith(
      jsonData.YellowbrickRace,
      expect.anything(),
    );
    expect(createCourseNode).toHaveBeenCalledWith(
      jsonData.YellowbrickCourseNode,
      expect.anything(),
    );
    expect(createLeaderboardTeam).toHaveBeenCalledWith(
      jsonData.YellowbrickLeaderboardTeam,
      expect.anything(),
    );
    expect(createPoi).toHaveBeenCalledWith(
      jsonData.YellowbrickPoi,
      expect.anything(),
    );
    expect(createPosition).toHaveBeenCalledWith(
      jsonData.YellowbrickPosition,
      expect.anything(),
    );
    expect(createTag).toHaveBeenCalledWith(
      jsonData.YellowbrickTag,
      expect.anything(),
    );
    expect(createTeam).toHaveBeenCalledWith(
      jsonData.YellowbrickTeam,
      expect.anything(),
    );
    expect(normalizeSpy).toHaveBeenCalledWith(jsonData, expect.anything());
    expect(axiosPostSpy).toHaveBeenCalledTimes(
      process.env.GEO_DATA_SLICER ? 1 : 0,
    );
  });
});

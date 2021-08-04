const db = require('../../models');
const normalizeObj = require('../normalization/normalizeISail');
const normalizeSpy = jest
  .spyOn(normalizeObj, 'normalizeRace')
  .mockImplementation(() => Promise.resolve());
const saveISailData = require('../saveISailData');
const jsonData = require('../../test-files/iSail.json');

describe('Storing iSail data to DB', () => {
  let createClass,
    createCourseMark,
    createEvent,
    createEventParticipant,
    createEventTracksData,
    createMark,
    createPosition,
    createRace,
    createResult,
    createRounding,
    createStartline,
    createTrack;

  beforeAll(async () => {
    createClass = jest.spyOn(db.iSailClass, 'bulkCreate');
    createCourseMark = jest.spyOn(db.iSailCourseMark, 'bulkCreate');
    createEvent = jest.spyOn(db.iSailEvent, 'bulkCreate');
    createEventParticipant = jest.spyOn(db.iSailEventParticipant, 'bulkCreate');
    createEventTracksData = jest.spyOn(db.iSailEventTracksData, 'bulkCreate');
    createMark = jest.spyOn(db.iSailMark, 'bulkCreate');
    createPosition = jest.spyOn(db.iSailPosition, 'bulkCreate');
    createRace = jest.spyOn(db.iSailRace, 'bulkCreate');
    createResult = jest.spyOn(db.iSailResult, 'bulkCreate');
    createRounding = jest.spyOn(db.iSailRounding, 'bulkCreate');
    createStartline = jest.spyOn(db.iSailStartline, 'bulkCreate');
    createTrack = jest.spyOn(db.iSailTrack, 'bulkCreate');
    await db.sequelize.sync();
  });
  afterAll(async () => {
    await db.iSailClass.destroy({ truncate: true });
    await db.iSailEvent.destroy({ truncate: true });
    await db.iSailRace.destroy({ truncate: true });
    await db.iSailEventParticipant.destroy({ truncate: true });
    await db.iSailEventTracksData.destroy({ truncate: true });
    await db.iSailPosition.destroy({ truncate: true });
    await db.iSailTrack.destroy({ truncate: true });
    await db.iSailMark.destroy({ truncate: true });
    await db.iSailStartline.destroy({ truncate: true });
    await db.iSailCourseMark.destroy({ truncate: true });
    await db.iSailRounding.destroy({ truncate: true });
    await db.iSailResult.destroy({ truncate: true });
    await db.iSailFailedUrl.destroy({ truncate: true });
    await db.iSailSuccessfulUrl.destroy({ truncate: true });
    await db.sequelize.close();
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should not save anything when empty data', async () => {
    await saveISailData({});
    expect(createClass).toHaveBeenCalledTimes(0);
    expect(createCourseMark).toHaveBeenCalledTimes(0);
    expect(createEvent).toHaveBeenCalledTimes(0);
    expect(createEventParticipant).toHaveBeenCalledTimes(0);
    expect(createEventTracksData).toHaveBeenCalledTimes(0);
    expect(createMark).toHaveBeenCalledTimes(0);
    expect(createPosition).toHaveBeenCalledTimes(0);
    expect(createRace).toHaveBeenCalledTimes(0);
    expect(createResult).toHaveBeenCalledTimes(0);
    expect(createRounding).toHaveBeenCalledTimes(0);
    expect(createStartline).toHaveBeenCalledTimes(0);
    expect(createTrack).toHaveBeenCalledTimes(0);
    expect(normalizeSpy).toHaveBeenCalledTimes(0);
  });
  it('should save data correctly', async () => {
    await saveISailData(jsonData);
    expect(createClass).toHaveBeenCalledWith(
      jsonData.iSailClass,
      expect.anything(),
    );
    expect(createCourseMark).toHaveBeenCalledWith(
      jsonData.iSailCourseMark,
      expect.anything(),
    );
    expect(createEvent).toHaveBeenCalledWith(
      jsonData.iSailEvent,
      expect.anything(),
    );
    expect(createEventParticipant).toHaveBeenCalledWith(
      jsonData.iSailEventParticipant,
      expect.anything(),
    );
    expect(createEventTracksData).toHaveBeenCalledWith(
      jsonData.iSailEventTracksData,
      expect.anything(),
    );
    expect(createMark).toHaveBeenCalledWith(
      jsonData.iSailMark,
      expect.anything(),
    );
    expect(createPosition).toHaveBeenCalledWith(
      jsonData.iSailPosition,
      expect.anything(),
    );
    expect(createRace).toHaveBeenCalledWith(
      jsonData.iSailRace,
      expect.anything(),
    );
    expect(createResult).toHaveBeenCalledWith(
      jsonData.iSailResult,
      expect.anything(),
    );
    expect(createRounding).toHaveBeenCalledWith(
      jsonData.iSailRounding,
      expect.anything(),
    );
    expect(createStartline).toHaveBeenCalledWith(
      jsonData.iSailStartline,
      expect.anything(),
    );
    expect(createTrack).toHaveBeenCalledWith(
      jsonData.iSailTrack,
      expect.anything(),
    );
    expect(normalizeSpy).toHaveBeenCalledWith(jsonData, expect.anything());
  });
});

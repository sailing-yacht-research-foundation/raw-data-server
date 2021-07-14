const db = require('../../models');
const saveISailData = require('../saveISailData');

const jsonData = require('../../test-files/iSail.json');

describe('Storing iSail data to DB', () => {
  beforeAll(async () => {
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
  it('should not save anything when empty data', async () => {
    const createClass = jest.spyOn(db.iSailClass, 'bulkCreate');
    const createCourseMark = jest.spyOn(db.iSailCourseMark, 'bulkCreate');
    const createEvent = jest.spyOn(db.iSailEvent, 'bulkCreate');
    const createEventParticipant = jest.spyOn(
      db.iSailEventParticipant,
      'bulkCreate',
    );
    const createEventTracksData = jest.spyOn(
      db.iSailEventTracksData,
      'bulkCreate',
    );
    const createMark = jest.spyOn(db.iSailMark, 'bulkCreate');
    const createPosition = jest.spyOn(db.iSailPosition, 'bulkCreate');
    const createRace = jest.spyOn(db.iSailRace, 'bulkCreate');
    const createResult = jest.spyOn(db.iSailResult, 'bulkCreate');
    const createRounding = jest.spyOn(db.iSailRounding, 'bulkCreate');
    const createStartline = jest.spyOn(db.iSailStartline, 'bulkCreate');
    const createTrack = jest.spyOn(db.iSailTrack, 'bulkCreate');
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
  });
  it('should save data correctly', async () => {
    const createClass = jest.spyOn(db.iSailClass, 'bulkCreate');
    const createCourseMark = jest.spyOn(db.iSailCourseMark, 'bulkCreate');
    const createEvent = jest.spyOn(db.iSailEvent, 'bulkCreate');
    const createEventParticipant = jest.spyOn(
      db.iSailEventParticipant,
      'bulkCreate',
    );
    const createEventTracksData = jest.spyOn(
      db.iSailEventTracksData,
      'bulkCreate',
    );
    const createMark = jest.spyOn(db.iSailMark, 'bulkCreate');
    const createPosition = jest.spyOn(db.iSailPosition, 'bulkCreate');
    const createRace = jest.spyOn(db.iSailRace, 'bulkCreate');
    const createResult = jest.spyOn(db.iSailResult, 'bulkCreate');
    const createRounding = jest.spyOn(db.iSailRounding, 'bulkCreate');
    const createStartline = jest.spyOn(db.iSailStartline, 'bulkCreate');
    const createTrack = jest.spyOn(db.iSailTrack, 'bulkCreate');
    await saveISailData(jsonData);
    expect(createClass).toHaveBeenCalledTimes(1);
    expect(createCourseMark).toHaveBeenCalledTimes(1);
    expect(createEvent).toHaveBeenCalledTimes(1);
    expect(createEventParticipant).toHaveBeenCalledTimes(1);
    expect(createEventTracksData).toHaveBeenCalledTimes(1);
    expect(createMark).toHaveBeenCalledTimes(1);
    expect(createPosition).toHaveBeenCalledTimes(1);
    expect(createRace).toHaveBeenCalledTimes(1);
    expect(createResult).toHaveBeenCalledTimes(1);
    expect(createRounding).toHaveBeenCalledTimes(1);
    expect(createStartline).toHaveBeenCalledTimes(1);
    expect(createTrack).toHaveBeenCalledTimes(1);
  });
  it('should throw error when one fails to execute', async () => {
    const invalidData = {
      iSailEvent: [
        {
          original_id: 14,
          url: 'http://app.i-sail.com/eventDetails/13',
        },
      ],
    };
    const response = await saveISailData(invalidData);
    expect(response).toEqual(expect.stringContaining('cannot be null'));
  });
});

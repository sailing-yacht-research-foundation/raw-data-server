const db = require('../../models');
const saveKwindooData = require('../saveKwindooData');

const jsonData = require('../../test-files/kwindoo.json');

describe('Storing kwindoo data to DB', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  afterAll(async () => {
    await db.kwindooRegattaOwner.destroy({ truncate: true });
    await db.kwindooRegatta.destroy({ truncate: true });
    await db.kwindooRace.destroy({ truncate: true });
    await db.kwindooBoat.destroy({ truncate: true });
    await db.kwindooComment.destroy({ truncate: true });
    await db.kwindooHomeportLocation.destroy({ truncate: true });
    await db.kwindooMarker.destroy({ truncate: true });
    await db.kwindooMIA.destroy({ truncate: true });
    await db.kwindooPOI.destroy({ truncate: true });
    await db.kwindooPosition.destroy({ truncate: true });
    await db.kwindooRunningGroup.destroy({ truncate: true });
    await db.kwindooVideoStream.destroy({ truncate: true });
    await db.kwindooWaypoint.destroy({ truncate: true });
    await db.kwindooFailedUrl.destroy({ truncate: true });
    await db.kwindooSuccessfulUrl.destroy({ truncate: true });
    await db.sequelize.close();
  });
  afterEach(async () => {
    jest.resetAllMocks();
  });
  it('should not save anything when empty data', async () => {
    const createRegattaOwner = jest.spyOn(db.kwindooRegattaOwner, 'bulkCreate');
    const createRegatta = jest.spyOn(db.kwindooRegatta, 'bulkCreate');
    const createRace = jest.spyOn(db.kwindooRace, 'bulkCreate');
    const createComment = jest.spyOn(db.kwindooComment, 'bulkCreate');
    const createHomeportLocation = jest.spyOn(
      db.kwindooHomeportLocation,
      'bulkCreate',
    );
    const createMarker = jest.spyOn(db.kwindooMarker, 'bulkCreate');
    const createMIA = jest.spyOn(db.kwindooMIA, 'bulkCreate');
    const createPOI = jest.spyOn(db.kwindooPOI, 'bulkCreate');
    const createPosition = jest.spyOn(db.kwindooPosition, 'bulkCreate');
    const createRunningGroup = jest.spyOn(db.kwindooRunningGroup, 'bulkCreate');
    const createVideoStream = jest.spyOn(db.kwindooVideoStream, 'bulkCreate');
    const createWaypoint = jest.spyOn(db.kwindooWaypoint, 'bulkCreate');

    await saveKwindooData({});

    expect(createRegattaOwner).toHaveBeenCalledTimes(0);
    expect(createRegatta).toHaveBeenCalledTimes(0);
    expect(createRace).toHaveBeenCalledTimes(0);
    expect(createComment).toHaveBeenCalledTimes(0);
    expect(createHomeportLocation).toHaveBeenCalledTimes(0);
    expect(createMarker).toHaveBeenCalledTimes(0);
    expect(createMIA).toHaveBeenCalledTimes(0);
    expect(createPOI).toHaveBeenCalledTimes(0);
    expect(createPosition).toHaveBeenCalledTimes(0);
    expect(createRunningGroup).toHaveBeenCalledTimes(0);
    expect(createVideoStream).toHaveBeenCalledTimes(0);
    expect(createWaypoint).toHaveBeenCalledTimes(0);
  });
  it('should save data correctly', async () => {
    const createRegattaOwner = jest.spyOn(db.kwindooRegattaOwner, 'bulkCreate');
    const createRegatta = jest.spyOn(db.kwindooRegatta, 'bulkCreate');
    const createRace = jest.spyOn(db.kwindooRace, 'bulkCreate');
    const createComment = jest.spyOn(db.kwindooComment, 'bulkCreate');
    const createHomeportLocation = jest.spyOn(
      db.kwindooHomeportLocation,
      'bulkCreate',
    );
    const createMarker = jest.spyOn(db.kwindooMarker, 'bulkCreate');
    const createMIA = jest.spyOn(db.kwindooMIA, 'bulkCreate');
    const createPOI = jest.spyOn(db.kwindooPOI, 'bulkCreate');
    const createPosition = jest.spyOn(db.kwindooPosition, 'bulkCreate');
    const createRunningGroup = jest.spyOn(db.kwindooRunningGroup, 'bulkCreate');
    const createVideoStream = jest.spyOn(db.kwindooVideoStream, 'bulkCreate');
    const createWaypoint = jest.spyOn(db.kwindooWaypoint, 'bulkCreate');

    await saveKwindooData(jsonData);

    expect(createRegattaOwner).toHaveBeenCalledTimes(1);
    expect(createRegatta).toHaveBeenCalledTimes(1);
    expect(createRace).toHaveBeenCalledTimes(1);
    expect(createComment).toHaveBeenCalledTimes(1);
    expect(createHomeportLocation).toHaveBeenCalledTimes(1);
    expect(createMarker).toHaveBeenCalledTimes(1);
    expect(createMIA).toHaveBeenCalledTimes(1);
    expect(createPOI).toHaveBeenCalledTimes(1);
    expect(createPosition).toHaveBeenCalledTimes(1);
    expect(createRunningGroup).toHaveBeenCalledTimes(1);
    expect(createVideoStream).toHaveBeenCalledTimes(1);
    expect(createWaypoint).toHaveBeenCalledTimes(1);
  });
});

const db = require('../../models');
const saveRaceQsData = require('../saveRaceQsData');
const s3Util = require('../uploadFileToS3');

const jsonData = require('../../test-files/raceQs.json');

jest.mock('../uploadFileToS3', () => ({
  uploadGeoJsonToS3: jest.fn(),
}));
jest.mock('../../utils/elasticsearch', () => ({
  indexRace: jest.fn(),
}));
jest.setTimeout(60000);
describe('Storing RaceQS data to DB', () => {
  beforeAll(async () => {
    await db.raceQsRegatta.sync({ force: true });
    await db.raceQsEvent.sync({ force: true });
    await db.raceQsDivision.sync({ force: true });
    await db.raceQsParticipant.sync({ force: true });
    await db.raceQsPosition.sync({ force: true });
    await db.raceQsRoute.sync({ force: true });
    await db.raceQsStart.sync({ force: true });
    await db.raceQsWaypoint.sync({ force: true });
    await db.raceQsFailedUrl.sync({ force: true });
    await db.raceQsSuccessfulUrl.sync({ force: true });
    await db.readyAboutRaceMetadata.sync({ force: true });
    await db.readyAboutTrackGeoJsonLookup.sync({ force: true });
  });
  afterAll(async () => {
    await db.raceQsRegatta.destroy({ truncate: true });
    await db.raceQsEvent.destroy({ truncate: true });
    await db.raceQsDivision.destroy({ truncate: true });
    await db.raceQsParticipant.destroy({ truncate: true });
    await db.raceQsPosition.destroy({ truncate: true });
    await db.raceQsRoute.destroy({ truncate: true });
    await db.raceQsStart.destroy({ truncate: true });
    await db.raceQsWaypoint.destroy({ truncate: true });
    await db.raceQsFailedUrl.destroy({ truncate: true });
    await db.raceQsSuccessfulUrl.destroy({ truncate: true });
    await db.readyAboutRaceMetadata.destroy({ truncate: true });
    await db.readyAboutTrackGeoJsonLookup.destroy({ truncate: true });
    await db.sequelize.close();
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should not save anything when empty data', async () => {
    const createRegatta = jest.spyOn(db.raceQsRegatta, 'bulkCreate');
    const createEvent = jest.spyOn(db.raceQsEvent, 'bulkCreate');
    const createDivision = jest.spyOn(db.raceQsDivision, 'bulkCreate');
    const createParticipant = jest.spyOn(db.raceQsParticipant, 'bulkCreate');
    const createPosition = jest.spyOn(db.raceQsPosition, 'bulkCreate');
    const createRoute = jest.spyOn(db.raceQsRoute, 'bulkCreate');
    const createStart = jest.spyOn(db.raceQsStart, 'bulkCreate');
    const createWaypoint = jest.spyOn(db.raceQsWaypoint, 'bulkCreate');
    await saveRaceQsData({});
    expect(createRegatta).toHaveBeenCalledTimes(0);
    expect(createEvent).toHaveBeenCalledTimes(0);
    expect(createDivision).toHaveBeenCalledTimes(0);
    expect(createParticipant).toHaveBeenCalledTimes(0);
    expect(createPosition).toHaveBeenCalledTimes(0);
    expect(createRoute).toHaveBeenCalledTimes(0);
    expect(createStart).toHaveBeenCalledTimes(0);
    expect(createWaypoint).toHaveBeenCalledTimes(0);
  });
  it('should save data correctly', async () => {
    const createRegatta = jest.spyOn(db.raceQsRegatta, 'bulkCreate');
    const createEvent = jest.spyOn(db.raceQsEvent, 'bulkCreate');
    const createDivision = jest.spyOn(db.raceQsDivision, 'bulkCreate');
    const createParticipant = jest.spyOn(db.raceQsParticipant, 'bulkCreate');
    const createPosition = jest.spyOn(db.raceQsPosition, 'bulkCreate');
    const createRoute = jest.spyOn(db.raceQsRoute, 'bulkCreate');
    const createStart = jest.spyOn(db.raceQsStart, 'bulkCreate');
    const createWaypoint = jest.spyOn(db.raceQsWaypoint, 'bulkCreate');
    const uploadS3Spy = jest.spyOn(s3Util, 'uploadGeoJsonToS3');

    await saveRaceQsData(jsonData);
    expect(createRegatta).toHaveBeenCalledTimes(1);
    expect(createEvent).toHaveBeenCalledTimes(1);
    expect(createDivision).toHaveBeenCalledTimes(1);
    expect(createParticipant).toHaveBeenCalledTimes(1);
    expect(createPosition).toHaveBeenCalledTimes(1);
    expect(createRoute).toHaveBeenCalledTimes(1);
    expect(createStart).toHaveBeenCalledTimes(1);
    expect(createWaypoint).toHaveBeenCalledTimes(1);
    expect(uploadS3Spy).toHaveBeenCalledTimes(1);
  });
});

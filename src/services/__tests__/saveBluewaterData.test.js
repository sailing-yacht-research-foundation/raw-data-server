const db = require('../../models');
const saveBluewaterData = require('../saveBluewaterData');

const jsonData = require('../../test-files/bluewater.json');

describe('Storing bluewater data to DB', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  afterAll(async () => {
    await db.bluewaterRace.destroy({
      truncate: true,
    });
    await db.bluewaterBoat.destroy({
      truncate: true,
    });
    await db.bluewaterBoatHandicap.destroy({
      truncate: true,
    });
    await db.bluewaterBoatSocialMedia.destroy({
      truncate: true,
    });
    await db.bluewaterCrew.destroy({
      truncate: true,
    });
    await db.bluewaterCrewSocialMedia.destroy({
      truncate: true,
    });
    await db.bluewaterMap.destroy({
      truncate: true,
    });
    await db.bluewaterPosition.destroy({
      truncate: true,
    });
    await db.sequelize.close();
  });
  it('should not save anything when json data is empty', async () => {
    const createRace = jest.spyOn(db.bluewaterRace, 'bulkCreate');
    const createBoat = jest.spyOn(db.bluewaterBoat, 'bulkCreate');
    const createBoatHandicap = jest.spyOn(
      db.bluewaterBoatHandicap,
      'bulkCreate',
    );
    const createBoatSocialMedia = jest.spyOn(
      db.bluewaterBoatSocialMedia,
      'bulkCreate',
    );
    const createCrew = jest.spyOn(db.bluewaterCrew, 'bulkCreate');
    const createCrewSocialMedia = jest.spyOn(
      db.bluewaterCrewSocialMedia,
      'bulkCreate',
    );
    const createMap = jest.spyOn(db.bluewaterMap, 'bulkCreate');
    const createPosition = jest.spyOn(db.bluewaterPosition, 'bulkCreate');
    await saveBluewaterData({});
    expect(createRace).toHaveBeenCalledTimes(0);
    expect(createBoat).toHaveBeenCalledTimes(0);
    expect(createBoatHandicap).toHaveBeenCalledTimes(0);
    expect(createBoatSocialMedia).toHaveBeenCalledTimes(0);
    expect(createCrew).toHaveBeenCalledTimes(0);
    expect(createCrewSocialMedia).toHaveBeenCalledTimes(0);
    expect(createMap).toHaveBeenCalledTimes(0);
    expect(createPosition).toHaveBeenCalledTimes(0);
  });
  it('should save data correctly', async () => {
    const createRace = jest.spyOn(db.bluewaterRace, 'bulkCreate');
    const createBoat = jest.spyOn(db.bluewaterBoat, 'bulkCreate');
    const createBoatHandicap = jest.spyOn(
      db.bluewaterBoatHandicap,
      'bulkCreate',
    );
    const createBoatSocialMedia = jest.spyOn(
      db.bluewaterBoatSocialMedia,
      'bulkCreate',
    );
    const createCrew = jest.spyOn(db.bluewaterCrew, 'bulkCreate');
    const createCrewSocialMedia = jest.spyOn(
      db.bluewaterCrewSocialMedia,
      'bulkCreate',
    );
    const createMap = jest.spyOn(db.bluewaterMap, 'bulkCreate');
    const createPosition = jest.spyOn(db.bluewaterPosition, 'bulkCreate');
    await saveBluewaterData(jsonData);
    expect(createRace).toHaveBeenCalledTimes(1);
    expect(createBoat).toHaveBeenCalledTimes(1);
    expect(createBoatHandicap).toHaveBeenCalledTimes(1);
    expect(createBoatSocialMedia).toHaveBeenCalledTimes(1);
    expect(createCrew).toHaveBeenCalledTimes(1);
    expect(createCrewSocialMedia).toHaveBeenCalledTimes(1);
    expect(createMap).toHaveBeenCalledTimes(1);
    expect(createPosition).toHaveBeenCalledTimes(1);
  });
});
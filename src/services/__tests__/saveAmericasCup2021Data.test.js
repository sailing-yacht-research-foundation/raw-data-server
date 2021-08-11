const db = require('../../models');
const saveAmericasCup2021Data = require('../non-automatable/saveAmericasCup2021Data');
const data = require('../../test-files/americasCup2021.json');
const mock = require('../../test-files/americasCup2021Mock');
describe('Storing americascup2021 data to DB', () => {
  let createRace,
    createRaceStatus,
    createBoat,
    createBoatPosition,
    createBoatLeftFoilPosition,
    createBoatLeftFoilState,
    createBoatRightFoilPosition,
    createBoatRightFoilState,
    createBoatLeg,
    createBoatPenalty,
    createBoatProtest,
    createBoatRank,
    createBoatRudderAngle,
    createBoatSow,
    createBoatStatus,
    createBoatTwd,
    createBoatTws,
    createBoatVmg,
    createBuoy,
    createBuoyPosition,
    createTeam,
    createRanking,
    createRoundingTime,
    createWindData,
    createWindPoint,
    n;

  beforeAll(async () => {
    await db.sequelize.sync();
    createRace = jest.spyOn(db.americasCup2021Race, 'create');
    createRaceStatus = jest.spyOn(db.americasCup2021RaceStatus, 'bulkCreate');
    createBoat = jest.spyOn(db.americasCup2021Boat, 'bulkCreate');

    createBoatPosition = jest.spyOn(
      db.americasCup2021BoatPosition,
      'bulkCreate',
    );

    createBoatLeftFoilPosition = jest.spyOn(
      db.americasCup2021BoatLeftFoilPosition,
      'bulkCreate',
    );
    createBoatLeftFoilState = jest.spyOn(
      db.americasCup2021BoatLeftFoilState,
      'bulkCreate',
    );
    createBoatRightFoilPosition = jest.spyOn(
      db.americasCup2021BoatRightFoilPosition,
      'bulkCreate',
    );
    createBoatRightFoilState = jest.spyOn(
      db.americasCup2021BoatRightFoilState,
      'bulkCreate',
    );
    createBoatLeg = jest.spyOn(db.americasCup2021BoatLeg, 'bulkCreate');
    createBoatPenalty = jest.spyOn(db.americasCup2021BoatPenalty, 'bulkCreate');
    createBoatProtest = jest.spyOn(db.americasCup2021BoatProtest, 'bulkCreate');
    createBoatRank = jest.spyOn(db.americasCup2021BoatRank, 'bulkCreate');
    createBoatRudderAngle = jest.spyOn(
      db.americasCup2021BoatRudderAngle,
      'bulkCreate',
    );
    createBoatSow = jest.spyOn(db.americasCup2021BoatSow, 'bulkCreate');
    createBoatStatus = jest.spyOn(db.americasCup2021BoatStatus, 'bulkCreate');
    createBoatTwd = jest.spyOn(db.americasCup2021BoatTwd, 'bulkCreate');
    createBoatTws = jest.spyOn(db.americasCup2021BoatTws, 'bulkCreate');
    createBoatVmg = jest.spyOn(db.americasCup2021BoatVmg, 'bulkCreate');
    createBuoy = jest.spyOn(db.americasCup2021Buoy, 'bulkCreate');
    createBuoyPosition = jest.spyOn(
      db.americasCup2021BuoyPosition,
      'bulkCreate',
    );
    createTeam = jest.spyOn(db.americasCup2021Team, 'bulkCreate');
    createRanking = jest.spyOn(db.americasCup2021Ranking, 'bulkCreate');
    createRoundingTime = jest.spyOn(
      db.americasCup2021RoundingTime,
      'bulkCreate',
    );
    createWindData = jest.spyOn(db.americasCup2021WindData, 'bulkCreate');
    createWindPoint = jest.spyOn(db.americasCup2021WindPoint, 'bulkCreate');
    createBoundaryPacket = jest.spyOn(
      db.americasCup2021BoundaryPacket,
      'bulkCreate',
    );
  });
  afterAll(async () => {
    await db.americasCup2021Race.destroy({ truncate: true });
    await db.americasCup2021RaceStatus.destroy({ truncate: true });
    await db.americasCup2021Boat.destroy({ truncate: true });
    await db.americasCup2021BoatPosition.destroy({ truncate: true });
    await db.americasCup2021BoatLeftFoilPosition.destroy({ truncate: true });
    await db.americasCup2021BoatLeftFoilState.destroy({ truncate: true });
    await db.americasCup2021BoatRightFoilPosition.destroy({ truncate: true });
    await db.americasCup2021BoatRightFoilState.destroy({ truncate: true });
    await db.americasCup2021BoatLeg.destroy({ truncate: true });
    await db.americasCup2021BoatPenalty.destroy({ truncate: true });
    await db.americasCup2021BoatProtest.destroy({ truncate: true });
    await db.americasCup2021BoatRank.destroy({ truncate: true });
    await db.americasCup2021BoatRudderAngle.destroy({ truncate: true });
    await db.americasCup2021BoatSow.destroy({ truncate: true });
    await db.americasCup2021BoatStatus.destroy({ truncate: true });
    await db.americasCup2021BoatTwd.destroy({ truncate: true });
    await db.americasCup2021BoatTws.destroy({ truncate: true });
    await db.americasCup2021BoatVmg.destroy({ truncate: true });
    await db.americasCup2021Buoy.destroy({ truncate: true });
    await db.americasCup2021BuoyPosition.destroy({ truncate: true });
    await db.americasCup2021Team.destroy({ truncate: true });
    await db.americasCup2021Ranking.destroy({ truncate: true });
    await db.americasCup2021RoundingTime.destroy({ truncate: true });
    await db.americasCup2021WindData.destroy({ truncate: true });
    await db.americasCup2021WindPoint.destroy({ truncate: true });
    await db.americasCup2021BoundaryPacket.destroy({ truncate: true });
    await db.sequelize.close();
  });

  it('should not save anything when empty data', async () => {
    await saveAmericasCup2021Data({});
    expect(createRace).toHaveBeenCalledTimes(0);
    expect(createRaceStatus).toHaveBeenCalledTimes(0);
    expect(createBoat).toHaveBeenCalledTimes(0);
    expect(createBoatPosition).toHaveBeenCalledTimes(0);
    expect(createBoatLeftFoilPosition).toHaveBeenCalledTimes(0);
    expect(createBoatLeftFoilState).toHaveBeenCalledTimes(0);
    expect(createBoatRightFoilPosition).toHaveBeenCalledTimes(0);
    expect(createBoatRightFoilState).toHaveBeenCalledTimes(0);
    expect(createBoatLeg).toHaveBeenCalledTimes(0);
    expect(createBoatPenalty).toHaveBeenCalledTimes(0);
    expect(createBoatProtest).toHaveBeenCalledTimes(0);
    expect(createBoatRank).toHaveBeenCalledTimes(0);
    expect(createBoatRudderAngle).toHaveBeenCalledTimes(0);
    expect(createBoatSow).toHaveBeenCalledTimes(0);
    expect(createBoatStatus).toHaveBeenCalledTimes(0);
    expect(createBoatTwd).toHaveBeenCalledTimes(0);
    expect(createBoatTws).toHaveBeenCalledTimes(0);
    expect(createBoatVmg).toHaveBeenCalledTimes(0);
    expect(createBuoy).toHaveBeenCalledTimes(0);
    expect(createBuoyPosition).toHaveBeenCalledTimes(0);
    expect(createRanking).toHaveBeenCalledTimes(0);
    expect(createRoundingTime).toHaveBeenCalledTimes(0);
    expect(createWindData).toHaveBeenCalledTimes(0);
    expect(createWindPoint).toHaveBeenCalledTimes(0);
    expect(createBoundaryPacket).toHaveBeenCalledTimes(0);
  });
  it('should save data correctly', async () => {
    await saveAmericasCup2021Data(data);
    expect(createRace).toHaveBeenCalledWith(
      expect.objectContaining(mock.mockExpectRaceObject),
    );
    expect(createRace).toHaveBeenCalledTimes(1);
    expect(createRaceStatus).toHaveBeenCalledTimes(1);
    expect(createBoat).toHaveBeenCalledTimes(1);
    expect(createBoatPosition).toHaveBeenCalledTimes(1);
    expect(createBoatLeftFoilPosition).toHaveBeenCalledTimes(1);
    expect(createBoatLeftFoilState).toHaveBeenCalledTimes(1);
    expect(createBoatRightFoilPosition).toHaveBeenCalledTimes(1);
    expect(createBoatRightFoilState).toHaveBeenCalledTimes(1);
    expect(createBoatLeg).toHaveBeenCalledTimes(1);
    expect(createBoatPenalty).toHaveBeenCalledTimes(1);
    expect(createBoatProtest).toHaveBeenCalledTimes(1);
    expect(createBoatRank).toHaveBeenCalledTimes(1);
    expect(createBoatRudderAngle).toHaveBeenCalledTimes(1);
    expect(createBoatSow).toHaveBeenCalledTimes(1);
    expect(createBoatStatus).toHaveBeenCalledTimes(1);
    expect(createBoatTwd).toHaveBeenCalledTimes(1);
    expect(createBoatTws).toHaveBeenCalledTimes(1);
    expect(createBoatVmg).toHaveBeenCalledTimes(1);
    expect(createBuoy).toHaveBeenCalledTimes(1);
    expect(createBuoyPosition).toHaveBeenCalledTimes(1);
    expect(createRanking).toHaveBeenCalledTimes(1);
    expect(createRoundingTime).toHaveBeenCalledTimes(1);
    expect(createWindData).toHaveBeenCalledTimes(1);
    expect(createWindPoint).toHaveBeenCalledTimes(3);
    expect(createBoundaryPacket).toHaveBeenCalledTimes(1);
  });
});

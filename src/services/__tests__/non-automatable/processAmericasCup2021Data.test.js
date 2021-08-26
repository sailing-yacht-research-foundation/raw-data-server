const db = require('../../../models');
const {
  getRaces,
  getObjectToRaceMapping,
  processAmericasCup2021Data,
} = require('../../non-automatable/processAmericasCup2021Data');
const normalizeObj = require('../../normalization/non-automatable/normalizeAmericascup2021');
jest
  .spyOn(normalizeObj, 'normalizeRace')
  .mockImplementation(() => Promise.resolve());
const saveAmericasCup2021Data = require('../../non-automatable/saveAmericasCup2021Data');
const uploadUtil = require('../../uploadUtil');
const jsonData = require('../../../test-files/americasCup2021NormalizeData.json');
const inputData = require('../../../test-files/americasCup2021.json');

describe('Processing non-existent AmericasCup2021 Data from DB to Parquet', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  it('should not get any races', async () => {
    const races = await getRaces();
    expect(races.length).toEqual(0);
  });

  it('should fetch data from db, and return empty string for url', async () => {
    const fileUrl = await processAmericasCup2021Data();
    expect(fileUrl).toEqual('');
  });
});

describe('Processing exist AmericasCup2021 Data from DB to Parquet', () => {
  let race;
  let raceID;
  const americasCup2021Keys = Object.keys(db).filter(
    (i) => i.indexOf('americasCup2021') === 0,
  );
  beforeAll(async () => {
    await saveAmericasCup2021Data(inputData);
    raceID = jsonData.AmericasCup2021Boat[0].race_original_id;
    race = await db.americasCup2021Race.findOne({
      where: { original_id: raceID },
    });
  });
  afterAll(async () => {
    for (key of americasCup2021Keys) {
      await db[key].destroy({ truncate: true });
    }
    await db.sequelize.close();
    jest.restoreAllMocks();
  });
  it('should get races', async () => {
    const races = await getRaces();
    expect(races.length).toEqual(jsonData.AmericasCup2021Race.length);
    expect(parseInt(races[0].original_id)).toEqual(
      jsonData.AmericasCup2021Race[0].original_id,
    );
  });
  it('should get boats', async () => {
    const boats = await getObjectToRaceMapping('americasCup2021Boat', [
      race.id,
    ]);
    const expectedLength = jsonData.AmericasCup2021Boat.filter(
      (p) => p.race_original_id === raceID,
    ).length;
    expect(boats.size).toEqual(1);
    expect(boats.get(race.id).length).toEqual(expectedLength);
  });

  it('should get boat positions', async () => {
    const boatPositions = await getObjectToRaceMapping(
      'americasCup2021BoatPosition',
      [race.id],
    );
    expect(boatPositions.size).toEqual(1);
    expect(boatPositions.get(race.id).length).toEqual(100);
  });
  it('should get teams', async () => {
    const teams = await getObjectToRaceMapping('americasCup2021Team', [
      race.id,
    ]);
    expect(teams.size).toEqual(1);
    expect(teams.get(race.id).length).toEqual(5);
  });
  it('should fetch data from db, save a parquet file, and calls upload to s3', async () => {
    const mockS3UploadResultPath = {
      mainUrl: 'https://awsbucket.com/thebucket/americascup2021/main.parquet',
      positionUrl:
        'https://awsbucket.com/thebucket/americascup2021/position.parquet',
      twdUrl: 'https://awsbucket.com/thebucket/americascup2021/twd.parquet',
      twsUrl: 'https://awsbucket.com/thebucket/americascup2021/tws.parquet',
      vmgUrl: 'https://awsbucket.com/thebucket/americascup2021/vmg.parquet',
      boundaryPacketUrl:
        'https://awsbucket.com/thebucket/americascup2021/boundarypacket.parquet',
      buoyPositionUrl:
        'https://awsbucket.com/thebucket/americascup2021/buoyposition.parquet',
      buoyPositionStateUrl:
        'https://awsbucket.com/thebucket/americascup2021/buoypositionstate.parquet',
      windDataUrl:
        'https://awsbucket.com/thebucket/americascup2021/winddata.parquet',
      windPointUrl:
        'https://awsbucket.com/thebucket/americascup2021/windpoint.parquet',
    };
    const uploadSpy = jest
      .spyOn(uploadUtil, 'uploadFileToS3')
      .mockResolvedValueOnce(mockS3UploadResultPath.mainUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.positionUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.twdUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.twsUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.vmgUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.boundaryPacketUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.buoyPositionUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.buoyPositionStateUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.windDataUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.windPointUrl);

    const fileUrl = await processAmericasCup2021Data();
    expect(uploadSpy).toHaveBeenCalledTimes(10);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });
});

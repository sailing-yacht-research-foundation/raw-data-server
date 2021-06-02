const db = require('../../models');
const {
  getRaces,
  getClubs,
  getBuoys,
  getDorsals,
  getPlayers,
  getPositions,
  getResults,
  processEstelaData,
} = require('../processEstelaData');
const saveEstelaData = require('../saveEstelaData');
const writeToParquet = require('../writeToParquet');
const uploadFileToS3 = require('../uploadFileToS3');
const jsonData = require('../../test-files/estela.json');

jest.mock('../writeToParquet', () => jest.fn());
jest.mock('../uploadFileToS3', () => jest.fn());

describe('Processing non-existent Estela Data from DB to Parquet', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  it('should not get any races', async () => {
    const races = await getRaces();
    expect(races.length).toEqual(0);
  });

  it('should fetch data from db, and return empty string for url', async () => {
    const fileUrl = await processEstelaData();
    expect(fileUrl).toEqual('');
  });
});

describe('Processing exist Estela Data from DB to Parquet', () => {
  const raceID1 = 'f6373964-9496-46ba-b907-fa90f8c6fb62';
  const raceID2 = 'random';
  beforeAll(async () => {
    await saveEstelaData(jsonData);
  });
  afterAll(async () => {
    jest.resetAllMocks();
    await db.estelaRace.destroy({
      truncate: true,
    });
    await db.estelaClub.destroy({
      truncate: true,
    });
    await db.estelaBuoy.destroy({
      truncate: true,
    });
    await db.estelaDorsal.destroy({
      truncate: true,
    });
    await db.estelaResult.destroy({
      truncate: true,
    });
    await db.estelaPlayer.destroy({
      truncate: true,
    });
    await db.estelaPosition.destroy({
      truncate: true,
    });
    await db.sequelize.close();
  });
  it('should get races', async () => {
    const races = await getRaces();
    expect(races.length).toEqual(2);
  });
  it('should get clubs', async () => {
    const clubs = await getClubs();
    expect(clubs.size).toEqual(3);
  });
  it('should get buoys', async () => {
    const case1 = await getBuoys([raceID1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(raceID1).length).toEqual(2);
    const case2 = await getBuoys([raceID2]);
    expect(case2.size).toEqual(0);
  });
  it('should get dorsals', async () => {
    const case1 = await getDorsals([raceID1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(raceID1).length).toEqual(1);
    const case2 = await getDorsals([raceID2]);
    expect(case2.size).toEqual(0);
  });
  it('should get players', async () => {
    const case1 = await getPlayers([raceID1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(raceID1).length).toEqual(2);
    const case2 = await getPlayers([raceID2]);
    expect(case2.size).toEqual(0);
  });
  it('should get positions', async () => {
    const case1 = await getPositions([raceID1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(raceID1).length).toEqual(2);
    const case2 = await getPositions([raceID2]);
    expect(case2.size).toEqual(0);
  });
  it('should get results', async () => {
    const case1 = await getResults([raceID1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(raceID1).length).toEqual(1);
    const case2 = await getResults([raceID2]);
    expect(case2.size).toEqual(0);
  });

  it('should fetch data from db, save a parquet file, and calls upload to s3', async () => {
    const mockS3UploadResultPath =
      'https://awsbucket.com/thebucket/estela/result.parquet';
    uploadFileToS3.mockResolvedValueOnce(mockS3UploadResultPath);

    const fileUrl = await processEstelaData();
    expect(uploadFileToS3).toHaveBeenCalledTimes(1);
    expect(writeToParquet).toHaveBeenCalledTimes(1);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });
});

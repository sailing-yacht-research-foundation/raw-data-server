const db = require('../../models');
const {
  getRaces,
  getClubs,
  getBuoys,
  getDorsals,
  getPlayers,
  getResults,
  processEstelaData,
} = require('../processEstelaData');
const saveEstelaData = require('../saveEstelaData');
const uploadFileToS3 = require('../uploadFileToS3');
const jsonData = require('../../test-files/estela.json');

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
    await saveEstelaData({
      EstelaRace: {
        id: 'f6373964-9496-46ba-b907-fa90f8c6fb63',
        original_id: '6986',
        initLon: '3.1180188',
        initLat: '41.8491494',
        end: '2021-04-11 12:06:44',
        end_timestamp: '1618142804',
        ended_at: '2021-04-11 12:44:35',
        has_ended: 'true',
        has_started: 'true',
        length: '2.51319',
        name: 'Regata Diumenge 11-04-2021',
        offset: '2',
        onset: '2021-04-11 10:30:00',
        onset_timestamp: '1618137000',
        scheduled_timestamp: '1618136100',
        start: '2021-04-11 10:25:00',
        start_timestamp: '1618136700',
        url: 'https://www.estela.co/en/tracking-race/6985/regata-diumenge-11-04-2021',
        winds_csv: '',
        leg_winds_csv: '',
        club: null,
        club_original_id: null,
      },
    });
  });
  afterAll(async () => {
    jest.resetAllMocks();
    await db.estelaRace.destroy({ truncate: true });
    await db.estelaClub.destroy({ truncate: true });
    await db.estelaBuoy.destroy({ truncate: true });
    await db.estelaDorsal.destroy({ truncate: true });
    await db.estelaResult.destroy({ truncate: true });
    await db.estelaPlayer.destroy({ truncate: true });
    await db.estelaPosition.destroy({ truncate: true });
    await db.estelaSuccessfulUrl.destroy({ truncate: true });
    await db.estelaFailedUrl.destroy({ truncate: true });
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
  it('should get results', async () => {
    const case1 = await getResults([raceID1]);
    expect(case1.size).toEqual(1);
    expect(case1.get(raceID1).length).toEqual(1);
    const case2 = await getResults([raceID2]);
    expect(case2.size).toEqual(0);
  });

  it('should fetch data from db, save a parquet file, and calls upload to s3', async () => {
    const mockS3UploadResultPath = {
      mainUrl: 'https://awsbucket.com/thebucket/estela/main.parquet',
      positionUrl: 'https://awsbucket.com/thebucket/estela/position.parquet',
    };
    uploadFileToS3
      .mockResolvedValueOnce(mockS3UploadResultPath.mainUrl)
      .mockResolvedValueOnce(mockS3UploadResultPath.positionUrl);

    const fileUrl = await processEstelaData();
    expect(uploadFileToS3).toHaveBeenCalledTimes(2);
    expect(fileUrl).toEqual(mockS3UploadResultPath);
  });
});

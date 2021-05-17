const db = require('../../models');
const saveKattackData = require('../saveKattackData');

describe('Storing kattack data to DB', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  afterAll(async () => {
    await db.kattackYachtClub.destroy({
      truncate: true,
    });
    await db.kattackRace.destroy({
      truncate: true,
    });
    await db.kattackDevice.destroy({
      truncate: true,
    });
    await db.kattackPosition.destroy({
      truncate: true,
    });
    await db.kattackWaypoint.destroy({
      truncate: true,
    });
    await db.sequelize.close();
  });
  it('should save kattack yacht club correctly', async () => {
    const spyCreate = jest.spyOn(db.kattackYachtClub, 'bulkCreate');
    const spyFindAll = jest.spyOn(db.kattackYachtClub, 'findAll');
    await saveKattackData({
      kattackYachtClub: [
        {
          id: 'edeafea7-11c3-4504-af53-edd6e13288e8',
          original_id: '95b47b7f-75ab-4d8f-b2d5-4b86c72aab0c',
          name: 'J105 Class',
          external_url:
            'http://kws.kattack.com/player/regatta.aspx?YachtClubID=95b47b7f-75ab-4d8f-b2d5-4b86c72aab0c',
        },
        {
          id: '21191e0d-5f39-4f86-a041-f56a6c2279a0',
          original_id: '08ffc121-f063-4db7-ac57-fa10c4463929',
          name: 'Stony Brook School',
          external_url: 'http://www.stonybrookschool.org',
        },
      ],
    });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  it('should save kattack races correctly', async () => {
    const spyCreate = jest.spyOn(db.kattackRace, 'bulkCreate');
    const spyFindAll = jest.spyOn(db.kattackRace, 'findAll');
    await saveKattackData({
      kattackRace: [
        {
          id: '79722f12-5f07-43a1-a327-08459673802d',
          original_id: '1010',
          name: 'Ship Rock',
          original_paradigm: 'Feed',
          yacht_club: null,
          original_yacht_club_id: 'af3d4ce9-c375-4778-8abe-369b94b2c4a3',
          original_fleet_id: 'dbb87d7d-96af-42e9-b8d9-d70281f78005',
          original_series_id: '00000000-0000-0000-0000-000000000000',
          original_course_id: '107',
          start: 1400198400000,
          stop: 1400457600000,
          days: 3,
          sleep_hour: 0,
          wake_hour: 0,
          heartbeat_int_sec: 300,
          wait_samp_int_sec: 5,
          active_samp_int_sec: 300,
          active_pts: 3,
          still_pts: 100,
          still_radius_met: 0,
          upload_int_sec: 300,
          modified_time: 1400217508000,
          password: null,
          race_start_time_utc: 1359226800000,
          feed_start_time_epoch_offset_sec: 1400198400,
          prestart_length_sec: -40971600,
          race_start_time_epoch_offset_sec: 1359226800,
          race_finish_time_epoch_offset_sec: 1400457600,
          feed_length_sec: 259200,
          race_length_sec: 41230800,
          is_distance_race: true,
          is_open_feed: true,
          speed_filter_kts: 0,
          is_live: false,
          has_started: true,
          lon: 0,
          lat: 0,
          course_heading_deg: 0,
          js_race_feed_id: 1010,
          js_race_course_id: 107,
          url: 'http://kws.kattack.com/GEPlayer/GMPosDisplay.aspx?FeedID=1010',
          leaderboard_data: null,
        },
      ],
    });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  it('should save kattack devices correctly', async () => {
    const spyCreate = jest.spyOn(db.kattackDevice, 'bulkCreate');
    const spyFindAll = jest.spyOn(db.kattackDevice, 'findAll');
    await saveKattackData({
      kattackDevice: [
        {
          id: '14c6f1b7-2695-4a00-959c-def363521ede',
          original_id: '0-2417009.1^1091',
          race: 'f594e8fb-0cbd-4dbb-94a3-7c8991fc698c',
          original_race_id: '1091',
          name: 'Shady Lady',
          type: '0',
          lon: '-81.80127',
          lat: '24.56199',
          last_course_pt_lon: null,
          last_course_pt_lat: null,
          speed_kts: '0.94115901160325',
          heading_deg: '132.323565293307',
          mode: '1',
          status: '0',
          is_logging: false,
          is_blocked: false,
          device_row_id: '10065',
          yacht_club: null,
          original_yacht_club_id: '00000000-0000-0000-0000-000000000000',
          shared_device_row_id: '-1',
          status_msg: '',
          device_internal_name: '',
          epoch_offset_sec: 1400250333,
          elapsed_time_dhms: '2544:16:13:56',
          info_html: `Shady Lady<br />Last Comm (dd:hh:mm:ss) : 2544:16:13:56<br />Heading: 132<br />Speed: 0.9 Knots<br />Lat: 24°33'43.16" N,Lon: 81°48'4.57" W<br /><input type="button" class="removeButton" value="Remove" onclick="onRemoveClick(this)" id="0-2417009.1^1091"/input>`,
          info_html_2: `Shady Lady<br><br><input type="button" class="downloadButton" value="Download Track" onclick="onDownloadClick(this)" id="0-2417009.1^1091"/input>     <input type="button" class="removeButton" value="Remove" onclick="onRemoveClick(this)" id="0-2417009.1^1091"/input>`,
          js_data_id: '10065',
        },
      ],
    });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  it('should save kattack positions correctly', async () => {
    const spyCreate = jest.spyOn(db.kattackPosition, 'bulkCreate');
    const spyFindAll = jest.spyOn(db.kattackPosition, 'findAll');
    await saveKattackData({
      kattackPosition: [
        {
          id: '0709682c-c506-479c-a415-deef7e5c809a',
          device: '14c6f1b7-2695-4a00-959c-def363521ede',
          original_device_id: '0-2417009.1^1091',
          race: 'f594e8fb-0cbd-4dbb-94a3-7c8991fc698c',
          original_race_id: '1091',
          lon: '-81.78775',
          lat: '26.10097',
          time: 1400177252000,
          speed_kts: '4,7516140437983',
          distance_nm: '0,78401631722672',
          heading_deg: '232,029286662436',
          epoch_offset_sec: 1400159252,
        },
      ],
    });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  it('should save kattack waypoints correctly', async () => {
    const spyCreate = jest.spyOn(db.kattackWaypoint, 'bulkCreate');
    const spyFindAll = jest.spyOn(db.kattackWaypoint, 'findAll');
    await saveKattackData({
      kattackWaypoint: [
        {
          id: '938b53cf-77ff-4598-91c5-bce3117d5ec9',
          original_id: '163',
          race: '79722f12-5f07-43a1-a327-08459673802d',
          original_race_id: '1010',
          html_description: `<p style="width:200px">PSSA LA START<br />Lat: 33.9499900<br />Lon: -118.4583300</p>`,
          name: 'PSSA LA START',
          yacht_club: null,
          original_yacht_club_id: 'af3d4ce9-c375-4778-8abe-369b94b2c4a3',
          lon: '-118.45833',
          lat: '33.94999',
          epoch_offset_sec: -62135596800,
        },
        {
          id: '2dc0be09-65c1-4bd5-8148-78ea6e00b70b',
          original_id: '333',
          race: '79722f12-5f07-43a1-a327-08459673802d',
          original_race_id: '1010',
          html_description: `<p style="width:200px">ES2<br />Leg Distance: 3NM<br />Lat: 33.9068667<br />Lon: -118.4588833</p>`,
          name: 'ES2',
          yacht_club: null,
          original_yacht_club_id: 'af3d4ce9-c375-4778-8abe-369b94b2c4a3',
          lon: '-118.458883333333',
          lat: '33.9068666666667',
          epoch_offset_sec: -62135596800,
        },
      ],
    });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
});

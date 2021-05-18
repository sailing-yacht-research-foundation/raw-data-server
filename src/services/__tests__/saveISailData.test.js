const db = require('../../models');
const saveISailData = require('../saveISailData');

describe('Storing iSail data to DB', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  afterAll(async () => {
    await db.iSailClass.destroy({
      truncate: true,
    });
    await db.iSailEvent.destroy({
      truncate: true,
    });
    await db.iSailRace.destroy({
      truncate: true,
    });
    await db.iSailEventParticipant.destroy({
      truncate: true,
    });
    await db.iSailEventTracksData.destroy({
      truncate: true,
    });
    await db.iSailPosition.destroy({
      truncate: true,
    });
    await db.iSailTrack.destroy({
      truncate: true,
    });
    await db.iSailMark.destroy({
      truncate: true,
    });
    await db.iSailStartline.destroy({
      truncate: true,
    });
    await db.iSailCourseMark.destroy({
      truncate: true,
    });
    await db.iSailRounding.destroy({
      truncate: true,
    });
    await db.iSailResult.destroy({
      truncate: true,
    });
    await db.sequelize.close();
  });
  it('should save iSail Classes correctly', async () => {
    const spyCreate = jest.spyOn(db.iSailClass, 'bulkCreate');
    const spyFindAll = jest.spyOn(db.iSailClass, 'findAll');
    await saveISailData({
      iSailClass: [
        {
          id: '42574d0c-3781-4d72-9ad8-1f41814924d0',
          original_id: '15',
          name: 'Randmeer',
        },
        {
          id: '934c6414-231c-4ca4-a684-816e42fb7960',
          original_id: '11',
          name: 'Finn',
        },
      ],
    });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  it('should save iSail Event correctly', async () => {
    const spy = jest.spyOn(db.iSailEvent, 'create');
    await saveISailData({
      iSailEvent: {
        id: 'd451063e-b576-4b23-8638-457e68cb6c26',
        original_id: 13,
        name: 'DiZeBra 20150421',
        start_date: '2015-04-21 00:00:00.000000',
        start_timezone_type: '3',
        start_timezone: 'Europe/Paris',
        stop_date: '2015-04-21 00:00:00.000000',
        stop_timezone_type: '3',
        stop_timezone: 'Europe/Paris',
        club: 'WV Braassemermeer',
        location: 'Braassemermeer',
        url: 'http://app.i-sail.com/eventDetails/13',
      },
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });
  it('should save iSail Races correctly', async () => {
    const spyCreate = jest.spyOn(db.iSailRace, 'bulkCreate');
    const spyFindAll = jest.spyOn(db.iSailRace, 'findAll');
    await saveISailData({
      iSailRace: [
        {
          id: 'c3f5b5af-9fd8-4cef-bc8b-8e702ad57e71',
          original_id: 21,
          event: 'd451063e-b576-4b23-8638-457e68cb6c26',
          original_event_id: 13,
          name: '',
          start: 1429635072,
          stop: 1429645312,
          wind_direction: 0,
          url: 'http://app.i-sail.com/eventDetails/13/raceDetails?race=',
        },
        {
          id: '887b3f6b-ee23-4ce0-9269-873842ef99f7',
          original_id: 44,
          event: 'd451063e-b576-4b23-8638-457e68cb6c26',
          original_event_id: 13,
          name: '',
          start: 1429635072,
          stop: 1429645312,
          wind_direction: 0,
          url: 'http://app.i-sail.com/eventDetails/13/raceDetails?race=',
        },
      ],
    });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  it('should save iSail Event Participants correctly', async () => {
    const spyFindAll = jest.spyOn(db.iSailEventParticipant, 'findAll');
    const spyCreate = jest.spyOn(db.iSailEventParticipant, 'bulkCreate');
    await saveISailData({
      iSailEventParticipant: [
        {
          id: '19f155ca-c71c-4efd-aad9-f3b5dc197baf',
          original_id: 43,
          class: '42574d0c-3781-4d72-9ad8-1f41814924d0',
          original_class_id: 15,
          class_name: 'Randmeer',
          sail_no: null,
          event: 'd451063e-b576-4b23-8638-457e68cb6c26',
          original_event_id: 13,
          name: 'Nico Overbeeke',
        },
      ],
    });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  it('should save iSail Event Track Data correctly', async () => {
    const spy = jest.spyOn(db.iSailEventTracksData, 'create');
    await saveISailData({
      iSailEventTracksData: {
        id: 'd2ebc1c0-0381-4cdd-aaac-4408baccc030',
        event: 'd451063e-b576-4b23-8638-457e68cb6c26',
        original_event_id: 13,
        min_lon: 4.639424,
        max_lon: 4.653772,
        min_lat: 52.18676,
        max_lat: 52.1981,
        start_time: 1429635072,
        stop_time: 1429645312,
      },
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });
  it('should save iSail Positions correctly', async () => {
    const spyFindAll = jest.spyOn(db.iSailPosition, 'findAll');
    const spyCreate = jest.spyOn(db.iSailPosition, 'bulkCreate');
    await saveISailData({
      iSailPosition: [
        {
          id: '5966a9eb-c2fa-4d1b-a2c3-a62414cee7a7',
          event: 'd451063e-b576-4b23-8638-457e68cb6c26',
          original_event_id: 13,
          track_data: 'd2ebc1c0-0381-4cdd-aaac-4408baccc030',
          track: 'feff0d0e-0027-44ba-a81f-59603600f60d',
          original_track_id: 329,
          participant: '19f155ca-c71c-4efd-aad9-f3b5dc197baf',
          original_participant_id: 43,
          class: '42574d0c-3781-4d72-9ad8-1f41814924d0',
          original_class_id: 15,
          time: 1429635466000,
          speed: '0',
          heading: '0',
          distance: '0',
          lon: '4.639784',
          lat: '52.19545',
        },
      ],
    });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  it('should save iSail Tracks correctly', async () => {
    const spyFindAll = jest.spyOn(db.iSailTrack, 'findAll');
    const spyCreate = jest.spyOn(db.iSailTrack, 'bulkCreate');
    await saveISailData({
      iSailTrack: [
        {
          id: 'feff0d0e-0027-44ba-a81f-59603600f60d',
          original_id: 329,
          event: 'd451063e-b576-4b23-8638-457e68cb6c26',
          original_event_id: 13,
          track_data: 'd2ebc1c0-0381-4cdd-aaac-4408baccc030',
          participant: '19f155ca-c71c-4efd-aad9-f3b5dc197baf',
          original_participant_id: 43,
          class: '42574d0c-3781-4d72-9ad8-1f41814924d0',
          original_class_id: 15,
          original_user_id: 45,
          user_name: 'Nico Overbeeke',
          start_time: 1429635466,
          stop_time: 1429642828,
        },
      ],
    });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  it('should save iSail Marks correctly', async () => {
    const spyFindAll = jest.spyOn(db.iSailMark, 'findAll');
    const spyCreate = jest.spyOn(db.iSailMark, 'bulkCreate');
    await saveISailData({
      iSailMark: [
        {
          id: 'feff0d0e-0027-44ba-a81f-59603600f60e',
          original_id: 111,
          event: 'd451063e-b576-4b23-8638-457e68cb6c26',
          original_event_id: 13,
          race: 'c3f5b5af-9fd8-4cef-bc8b-8e702ad57e71',
          original_race_id: 21,
          name: 'Test',
          lon: '4.639784',
          lat: '52.19545',
        },
      ],
    });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  it('should save iSail Startline correctly', async () => {
    const spyFindAll = jest.spyOn(db.iSailStartline, 'findAll');
    const spyCreate = jest.spyOn(db.iSailStartline, 'bulkCreate');
    await saveISailData({
      iSailStartline: [
        {
          id: 'feff0d0e-0027-44ba-a81f-59603600f60e',
          original_id: 111,
          event: 'd451063e-b576-4b23-8638-457e68cb6c26',
          original_event_id: 13,
          race: 'c3f5b5af-9fd8-4cef-bc8b-8e702ad57e71',
          original_race_id: 21,
          name: 'Test',
          lon: '4.639784',
          lat: '52.19545',
          lon1: '4.639784',
          lat1: '52.19545',
          lon2: '4.639784',
          lat2: '52.19545',
        },
      ],
    });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  it('should save iSail Course Marks correctly', async () => {
    const spyFindAll = jest.spyOn(db.iSailCourseMark, 'findAll');
    const spyCreate = jest.spyOn(db.iSailCourseMark, 'bulkCreate');
    await saveISailData({
      iSailCourseMark: [
        {
          id: 'feff0d0e-0027-44ba-a81f-59603600f60f',
          original_id: 329,
          event: 'd451063e-b576-4b23-8638-457e68cb6c26',
          original_event_id: 13,
          race: 'c3f5b5af-9fd8-4cef-bc8b-8e702ad57e71',
          original_race_id: 21,
          position: '5966a9eb-c2fa-4d1b-a2c3-a62414cee7a7',
          mark: 'feff0d0e-0027-44ba-a81f-59603600f60e',
          original_mark_id: 111,
          startline: 'test',
          original_startline_id: 'test-ori',
        },
      ],
    });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  it('should save iSail Rounding correctly', async () => {
    const spyFindAll = jest.spyOn(db.iSailRounding, 'findAll');
    const spyCreate = jest.spyOn(db.iSailRounding, 'bulkCreate');
    await saveISailData({
      iSailRounding: [
        {
          id: 'aeff0d0e-0027-44ba-a81f-59603600f60e',
          original_id: 22,
          event: 'd451063e-b576-4b23-8638-457e68cb6c26',
          original_event_id: 13,
          track: 'feff0d0e-0027-44ba-a81f-59603600f60d',
          original_track_id: 329,
          course_mark: 'feff0d0e-0027-44ba-a81f-59603600f60f',
          original_course_mark_id: 329,
          time: 1429635072,
          time_since_last_mark: 1429635072,
          distance_since_last_mark: 1,
          rst: 1,
          rsd: 1,
          max_speed: 22,
        },
      ],
    });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  it('should save iSail Result correctly', async () => {
    const spyFindAll = jest.spyOn(db.iSailResult, 'findAll');
    const spyCreate = jest.spyOn(db.iSailResult, 'bulkCreate');
    await saveISailData({
      iSailResult: [
        {
          id: 'aeff0d0e-0027-44ba-a81f-59603600f60e',
          original_id: 22,
          event: 'd451063e-b576-4b23-8638-457e68cb6c26',
          original_event_id: 13,
          race: 'c3f5b5af-9fd8-4cef-bc8b-8e702ad57e71',
          original_race_id: 21,
          name: 'Test',
          points: 100,
          time: 1429635072,
          finaled: '1',
          participant: '19f155ca-c71c-4efd-aad9-f3b5dc197baf',
          original_participant_id: 43,
        },
      ],
    });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
});

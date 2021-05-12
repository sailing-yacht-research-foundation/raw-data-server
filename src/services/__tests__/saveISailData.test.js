const db = require('../../models');
const saveISailData = require('../saveISailData');

describe('Storing iSail data to DB', () => {
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
});

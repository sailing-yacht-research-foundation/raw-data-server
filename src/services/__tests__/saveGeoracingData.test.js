const db = require('../../models');
const saveGeoracingData = require('../saveGeoracingData');

describe('Storing georacing data to DB', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  afterAll(async () => {
    await db.georacingEvent.destroy({
      truncate: true,
    });
    await db.georacingRace.destroy({
      truncate: true,
    });
    await db.georacingActor.destroy({
      truncate: true,
    });
    await db.georacingGroundPlace.destroy({
      truncate: true,
    });
    await db.sequelize.close();
  });
  it('should save georacing events correctly', async () => {
    const spyCreate = jest.spyOn(db.georacingEvent, 'bulkCreate');
    const spyFindAll = jest.spyOn(db.georacingEvent, 'findAll');
    await saveGeoracingData({
      georacingEvent: [
        {
          id: '8fd17e9c-bce2-45ea-9c63-1eca69963e18',
          original_id: '101898',
          name: 'Iditarod',
          short_name: 'Iditarod',
          time_zone: 'UTC',
          description_en: null,
          description_fr: null,
          short_description: 'Alaska, USA',
          start_time: '2021-03-07T00:00:00Z',
          end_time: '2021-03-18T00:00:00Z',
        },
        {
          id: '54503929-7f8d-4627-a40b-e7dca635a3dd',
          original_id: '101891',
          name: 'Beargrease Sled Dog',
          short_name: 'Beargrease',
          time_zone: 'UTC',
          description_en: null,
          description_fr: null,
          short_description: 'Duluth, Minnesota, USA',
          start_time: '2021-01-31T00:00:00Z',
          end_time: '2021-02-03T00:00:00Z',
        },
      ],
    });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  it('should save georacing races correctly', async () => {
    const spyCreate = jest.spyOn(db.georacingRace, 'bulkCreate');
    const spyFindAll = jest.spyOn(db.georacingRace, 'findAll');
    await saveGeoracingData({
      georacingRace: [
        {
          id: 'ecd58518-3ad9-4139-a46c-222ee7f4ae4f',
          original_id: '97711',
          event: '8fd17e9c-bce2-45ea-9c63-1eca69963e18',
          event_original_id: '101898',
          name: 'Iditarod',
          short_name: null,
          short_description: 'Alaska, USA',
          time_zone: 'UTC',
          available_time: '2021-03-07T22:55:00Z',
          start_time: '2021-03-07T23:00:00Z',
          end_time: '2021-03-18T09:00:00Z',
          url: 'https://tracker2021.qrillpaws.net/iditarod.html',
          player_version: '3',
        },
      ],
    });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  it('should save georacing actors correctly', async () => {
    const spyCreate = jest.spyOn(db.georacingActor, 'bulkCreate');
    const spyFindAll = jest.spyOn(db.georacingActor, 'findAll');
    await saveGeoracingData({
      georacingActor: [
        {
          id: 'e56312ed-fb0a-4dbe-ba6c-0dfab853022a',
          original_id: null,
          race: 'ecd58518-3ad9-4139-a46c-222ee7f4ae4f',
          race_original_id: '97711',
          event: '8fd17e9c-bce2-45ea-9c63-1eca69963e18',
          event_original_id: '101898',
          tracker_id: null,
          tracker2_id: null,
          id_provider_actor: null,
          team_id: null,
          profile_id: null,
          start_number: '2',
          first_name: null,
          middle_name: null,
          last_name: null,
          name: 'AARON PECK',
          big_name: null,
          short_name: 'PECK',
          members: null,
          active: null,
          visible: 1,
          orientation_angle: null,
          start_time: null,
          has_penality: null,
          sponsor_url: null,
          start_order: null,
          rating: null,
          penality: null,
          penality_time: null,
          capital1: null,
          capital2: null,
          is_security: null,
          full_name: null,
          categories: '0',
          categories_name: null,
          all_info: null,
          nationality: 'CAN',
          model: 'circle',
          size: null,
          team: 'VETERAN',
          type: '0',
          orientation_mode: null,
          id_provider_tracker: null,
          id_provider_tracker2: null,
          states: null,
          person: null,
        },
        {
          id: 'a1c4314a-e265-4db8-9d1b-4de96a60ee23',
          original_id: null,
          race: 'ecd58518-3ad9-4139-a46c-222ee7f4ae4f',
          race_original_id: '97711',
          event: '8fd17e9c-bce2-45ea-9c63-1eca69963e18',
          event_original_id: '101898',
          tracker_id: null,
          tracker2_id: null,
          id_provider_actor: null,
          team_id: null,
          profile_id: null,
          start_number: '3',
          first_name: null,
          middle_name: null,
          last_name: null,
          name: 'PETE KAISER',
          big_name: null,
          short_name: 'KAISER',
          members: null,
          active: null,
          visible: 1,
          orientation_angle: null,
          start_time: null,
          has_penality: null,
          sponsor_url: null,
          start_order: null,
          rating: null,
          penality: null,
          penality_time: null,
          capital1: null,
          capital2: null,
          is_security: null,
          full_name: null,
          categories: '0',
          categories_name: null,
          all_info: null,
          nationality: 'USA',
          model: 'circle',
          size: null,
          team: 'VETERAN',
          type: '0',
          orientation_mode: null,
          id_provider_tracker: null,
          id_provider_tracker2: null,
          states: null,
          person: null,
        },
      ],
    });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  it('should save georacing ground place correctly', async () => {
    const spyCreate = jest.spyOn(db.georacingGroundPlace, 'bulkCreate');
    const spyFindAll = jest.spyOn(db.georacingGroundPlace, 'findAll');
    await saveGeoracingData({
      georacingGroundPlace: [
        {
          id: '810008e9-b933-44a5-9485-9d7306981125',
          original_id: '1000',
          race: 'ecd58518-3ad9-4139-a46c-222ee7f4ae4f',
          race_original_id: '97711',
          place_or_ground: 'place',
          name: '{"fr":"Anchorage","en":"Anchorage"}',
          lon: '-149.789657875',
          lat: '61.151188516571',
          size: '14',
          zoom_min: null,
          zoom_max: null,
        },
        {
          id: 'f5ec0fc3-4e55-4405-a9ed-7d0cb2df759d',
          original_id: '1002',
          race: 'ecd58518-3ad9-4139-a46c-222ee7f4ae4f',
          race_original_id: '97711',
          place_or_ground: 'place',
          name: '{"fr":"Willow","en":"Willow"}',
          lon: '-149.81506375878',
          lat: '62.027165874397',
          size: '14',
          zoom_min: null,
          zoom_max: null,
        },
      ],
    });
    expect(spyFindAll).toHaveBeenCalledTimes(1);
    expect(spyCreate).toHaveBeenCalledTimes(1);
  });
  // TODO: Add other georacing data.
  // Currently only these collections have values in the SYRF dev database
});

const db = require('../../models');
const {
  convertLiveDataToInsertData,
  dataPointSubscriberAction,
  getAllLiveDataPoint,
  getLiveDataPoint,
  saveLiveDataPoint,
} = require('../dataPoint');

describe('Processing Live Data Points', () => {
  beforeAll(async () => {
    await db.sequelize.sync();
  });
  afterAll(async () => {
    await db.liveDataPoint.destroy({
      truncate: true,
    });
    await db.sequelize.close();
  });
  it('should convert message queue data to database data', () => {
    const mqData = {
      lat: 110,
      lon: 68,
      speed: 5,
      heading: 50,
      accuracy: 0,
      altitude: 0,
      at: 1624280155971,
      tws: 2,
      twa: 45,
      stw: 7,
      raceData: {
        raceUnitId: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
        boatParticipantGroupId: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
        boatId: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
        deviceId: '217f3a7c-6d4d-42b9-9d9f-aa0f27a1b67f',
        userId: 'aa48d6c1-9eea-4d70-b893-33184ef1e6aa',
        publicId:
          'b8cd1e2f18e7c9cb9b817b741c5591182bf22e37def02faf41b7812bd04c05f762a3c231c522e733b98eb6f631fb6fe9',
      },
    };
    const dbData = convertLiveDataToInsertData(mqData);
    expect(dbData).toMatchObject({
      location: { type: 'Point', coordinates: [110, 68] },
      speed: 5,
      heading: 50,
      accuracy: 0,
      altitude: 0,
      at: 1624280155971,
      tws: 2,
      twa: 45,
      stw: 7,
      race_unit_id: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
      boat_participant_group_id: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
      boat_id: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
      device_id: '217f3a7c-6d4d-42b9-9d9f-aa0f27a1b67f',
      user_id: 'aa48d6c1-9eea-4d70-b893-33184ef1e6aa',
      public_id:
        'b8cd1e2f18e7c9cb9b817b741c5591182bf22e37def02faf41b7812bd04c05f762a3c231c522e733b98eb6f631fb6fe9',
    });
  });
  it('should save & get points correctly', async () => {
    const initPoints = await getAllLiveDataPoint();
    expect(initPoints.length).toEqual(0);
    await saveLiveDataPoint([
      {
        id: 'ea31cb70-0bc7-11ec-9a03-0242ac130003',
        location: { type: 'Point', coordinates: [39.807222, -76.984722] },
        speed: 5,
        heading: 50,
        accuracy: 0,
        altitude: 0,
        at: 1624280155971,
        tws: 2,
        twa: 45,
        stw: 7,
        race_unit_id: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
        boat_participant_group_id: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
        boat_id: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
        device_id: '217f3a7c-6d4d-42b9-9d9f-aa0f27a1b67f',
        user_id: 'aa48d6c1-9eea-4d70-b893-33184ef1e6aa',
        public_id:
          'b8cd1e2f18e7c9cb9b817b741c5591182bf22e37def02faf41b7812bd04c05f762a3c231c522e733b98eb6f631fb6fe9',
      },
    ]);
    const secondPoints = await getAllLiveDataPoint();
    expect(secondPoints.length).toEqual(1);
    const getData = await getLiveDataPoint('ea31cb70-0bc7-11ec-9a03-0242ac130003');
    expect(getData).toEqual({
      id: 'ea31cb70-0bc7-11ec-9a03-0242ac130003',
      location: {
        type: 'Point',
        crs: {
          properties: {
            name: "EPSG:4326",
          },
          type: "name",
        },
        coordinates: [39.807222, -76.984722]
      },
      speed: 5,
      heading: 50,
      accuracy: 0,
      altitude: 0,
      at: new Date('2021-06-21T12:55:55.971Z'),
      tws: 2,
      twa: 45,
      stw: 7,
      race_unit_id: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
      boat_participant_group_id: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
      boat_id: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
      device_id: '217f3a7c-6d4d-42b9-9d9f-aa0f27a1b67f',
      user_id: 'aa48d6c1-9eea-4d70-b893-33184ef1e6aa',
      public_id:
        'b8cd1e2f18e7c9cb9b817b741c5591182bf22e37def02faf41b7812bd04c05f762a3c231c522e733b98eb6f631fb6fe9',
    });
  });
  it('should process subscribe correctly', async () => {
    const headers = {
      isbatch: 'true',
    };
    const payload = {
      messages: [
        {
          lat: 110,
          lon: 68,
          speed: 5,
          heading: 50,
          accuracy: 0,
          altitude: 0,
          at: 1624280155971,
          tws: 2,
          twa: 45,
          stw: 7,
          raceData: {
            raceUnitId: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
            boatParticipantGroupId: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
            boatId: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
            deviceId: '217f3a7c-6d4d-42b9-9d9f-aa0f27a1b67f',
            userId: 'aa48d6c1-9eea-4d70-b893-33184ef1e6aa',
            publicId:
              'b8cd1e2f18e7c9cb9b817b741c5591182bf22e37def02faf41b7812bd04c05f762a3c231c522e733b98eb6f631fb6fe9',
          },
        },
        {
          lat: 110,
          lon: 68,
          speed: 5,
          heading: 50,
          accuracy: 0,
          altitude: 0,
          at: 1624280155971,
          tws: 2,
          twa: 45,
          stw: 7,
          raceData: {
            raceUnitId: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
            boatParticipantGroupId: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
            boatId: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
            deviceId: '217f3a7c-6d4d-42b9-9d9f-aa0f27a1b67f',
            userId: 'aa48d6c1-9eea-4d70-b893-33184ef1e6aa',
            publicId:
              'b8cd1e2f18e7c9cb9b817b741c5591182bf22e37def02faf41b7812bd04c05f762a3c231c522e733b98eb6f631fb6fe9',
          },
        },
      ],
    };
    await dataPointSubscriberAction(payload, headers);
    let points = await getAllLiveDataPoint();
    expect(points.length).toEqual(3);

    await dataPointSubscriberAction(
      {
        lat: 110,
        lon: 68,
        speed: 5,
        heading: 50,
        accuracy: 0,
        altitude: 0,
        at: 1624280155971,
        tws: 2,
        twa: 45,
        stw: 7,
        raceData: {
          raceUnitId: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
          boatParticipantGroupId: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
          boatId: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
          deviceId: '217f3a7c-6d4d-42b9-9d9f-aa0f27a1b67f',
          userId: 'aa48d6c1-9eea-4d70-b893-33184ef1e6aa',
          publicId:
            'b8cd1e2f18e7c9cb9b817b741c5591182bf22e37def02faf41b7812bd04c05f762a3c231c522e733b98eb6f631fb6fe9',
        },
      },
      {},
    );
    points = await getAllLiveDataPoint();
    expect(points.length).toEqual(4);
  });
});

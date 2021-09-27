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
      sog: 5,
      cog: 50,
      twa: 45,
      setDrift: 7,
      raceData: {
        competitionUnitId: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
        vesselParticipantId: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
        participantId: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
        userId: 'aa48d6c1-9eea-4d70-b893-33184ef1e6aa',
        publicId:
          'b8cd1e2f18e7c9cb9b817b741c5591182bf22e37def02faf41b7812bd04c05f762a3c231c522e733b98eb6f631fb6fe9',
      },
    };
    const dbData = convertLiveDataToInsertData(mqData);
    expect(dbData).toMatchObject({
      location: {
        crs: {
          type: 'name',
          properties: { name: 'EPSG:4326' },
        },
        type: 'Point',
        coordinates: [mqData.lon, mqData.lat],
      },
      sog: mqData.sog,
      cog: mqData.cog,
      twa: mqData.twa,
      set_drift: mqData.setDrift,
      competition_unit_id: mqData.raceData.competitionUnitId,
      vessel_participant_id: mqData.raceData.vesselParticipantId,
      participant_id: mqData.raceData.participantId,
      user_id: mqData.raceData.userId,
      public_id: mqData.raceData.publicId,
    });
  });
  it('should save & get points correctly', async () => {
    const initPoints = await getAllLiveDataPoint();
    const data = {
      id: 'ea31cb70-0bc7-11ec-9a03-0242ac130003',
      location: {
        crs: {
          type: 'name',
          properties: { name: 'EPSG:4326' },
        },
        type: 'Point',
        coordinates: [39.807222, -76.984722],
      },
      sog: 5,
      cog: 50,
      twa: 45,
      set_drift: 7,
      competition_unit_id: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
      vessel_participant_id: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
      participant_id: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
      user_id: 'aa48d6c1-9eea-4d70-b893-33184ef1e6aa',
      public_id:
        'b8cd1e2f18e7c9cb9b817b741c5591182bf22e37def02faf41b7812bd04c05f762a3c231c522e733b98eb6f631fb6fe9',
    };
    expect(initPoints.length).toEqual(0);
    await saveLiveDataPoint([data]);
    const secondPoints = await getAllLiveDataPoint();
    expect(secondPoints.length).toEqual(1);
    const getData = await getLiveDataPoint(data.id);
    expect(getData).toEqual(
      expect.objectContaining({
        id: data.id,
        location: {
          type: 'Point',
          crs: {
            properties: {
              name: 'EPSG:4326',
            },
            type: 'name',
          },
          coordinates: data.location.coordinates,
        },
        sog: data.sog,
        cog: data.cog,
        twa: data.twa,
        set_drift: data.set_drift,
      }),
    );
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
          sog: 5,
          cog: 50,
          twa: 45,
          setDrift: 7,
          raceData: {
            competitionUnitId: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
            vesselParticipantId: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
            participantId: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
            userId: 'aa48d6c1-9eea-4d70-b893-33184ef1e6aa',
            publicId:
              'b8cd1e2f18e7c9cb9b817b741c5591182bf22e37def02faf41b7812bd04c05f762a3c231c522e733b98eb6f631fb6fe9',
          },
        },
        {
          lat: 111,
          lon: 69,
          sog: 5,
          cog: 50,
          twa: 45,
          setDrift: 7,
          raceData: {
            competitionUnitId: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
            vesselParticipantId: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
            participantId: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
            userId: 'aa48d6c1-9eea-4d70-b893-33184ef1e6aa',
            publicId:
              'b8cd1e2f18e7c9cb9b817b741c5591182bf22e37def02faf41b7812bd04c05f762a3c231c522e733b98eb6f631fb6fe9',
          },
        },
      ],
    };
    let initPoints = await getAllLiveDataPoint();
    await dataPointSubscriberAction(payload, headers);
    let points = await getAllLiveDataPoint();
    expect(points.length).toEqual(initPoints.length + payload.messages.length);

    await dataPointSubscriberAction(
      {
        lat: 110,
        lon: 68,
        sog: 5,
        cog: 50,
        twa: 45,
        setDrift: 7,
        raceData: {
          competitionUnitId: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
          vesselParticipantId: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
          participantId: '58bdd428-7e23-4d5f-95c9-58b3baf93445',
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

const createMQSubscriber = require('../createMQSubscriber');
const { getAllLiveDataPoint } = require('../dataPoint');

const mqHost = process.env.MQ_HOST;
const mqPort = process.env.MQ_PORT;
const mqUser = process.env.MQ_USER;
const mqPassword = process.env.MQ_PASSWORD;

describe('Connect & Subscribe to topic from MQ', () => {
  it('should connect successfully to MQ', async () => {
    const onConnect = jest.fn();
    const subscriptions = [
      {
        topic: '/topic/rawdata.topic',
        action: jest.fn(),
      },
    ];
    const stompClient = createMQSubscriber(
      { mqHost, mqPort, mqUser, mqPassword },
      onConnect,
      subscriptions,
    );

    await new Promise((r) => setTimeout(r, 1000));
    expect(onConnect).toHaveBeenCalledTimes(1);

    stompClient.publish('/topic/rawdata.topic', {
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
    });

    await new Promise((r) => setTimeout(r, 1000));
    expect(subscriptions[0].action).toHaveBeenCalledTimes(1);
    stompClient.destroy();
  });

  it('should do nothing when no subscription is defined', async () => {
    const onConnect = jest.fn();
    const stompClient = createMQSubscriber(
      { mqHost, mqPort, mqUser, mqPassword },
      onConnect,
    );

    await new Promise((r) => setTimeout(r, 1000));
    expect(onConnect).toHaveBeenCalledTimes(1);

    stompClient.publish('/topic/rawdata.topic', {
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
    });

    await new Promise((r) => setTimeout(r, 1000));
    const dataPoints = await getAllLiveDataPoint();
    expect(dataPoints.length).toEqual(0);
    stompClient.destroy();
  });
});

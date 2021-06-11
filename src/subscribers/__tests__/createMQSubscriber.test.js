const createMQSubscriber = require('../createMQSubscriber');
const { getAllPositions } = require('../position');

const mqHost = 'localhost';
const mqPort = 61613;
const mqUser = 'guest';
const mqPassword = 'guest';

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
      id: '1',
      boat_id: 'boat1',
      race_id: 'race1',
      device_id: 'device1',
      position: '{lat: 123, lon: 123}',
      speed: 4,
      heading: 2,
      accuracy: 1,
      altitude: 10,
      at: 1,
      tws: 1,
      twa: 1,
      stw: 1,
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
      id: '1',
      boat_id: 'boat1',
      race_id: 'race1',
      device_id: 'device1',
      position: '{lat: 123, lon: 123}',
      speed: 4,
      heading: 2,
      accuracy: 1,
      altitude: 10,
      at: 1,
      tws: 1,
      twa: 1,
      stw: 1,
    });

    await new Promise((r) => setTimeout(r, 1000));
    const positions = getAllPositions();
    expect(positions.length).toEqual(0);
    stompClient.destroy();
  });
});

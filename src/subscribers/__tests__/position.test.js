const {
  savePosition,
  getPosition,
  getAllPositions,
  positionSubscriberAction,
} = require('../position');

describe('Processing Live Data Position', () => {
  it('should save & get positions correctly', async () => {
    const initPositions = getAllPositions();
    expect(initPositions.length).toEqual(0);
    savePosition({
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
    const secondPositions = getAllPositions();
    expect(secondPositions.length).toEqual(1);
    const getData = getPosition('1');
    expect(getData).toEqual({
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
  });

  it('should should process subscribe correctly', async () => {
    const headers = {
      isbatch: true,
    };
    const payload = {
      messages: [
        {
          id: '2',
          boat_id: 'boat2',
          race_id: 'race2',
          device_id: 'device2',
          position: '{lat: 123, lon: 123}',
          speed: 4,
          heading: 2,
          accuracy: 1,
          altitude: 10,
          at: 1,
          tws: 1,
          twa: 1,
          stw: 1,
        },
        {
          id: '3',
          boat_id: 'boat3',
          race_id: 'race3',
          device_id: 'device3',
          position: '{lat: 123, lon: 123}',
          speed: 4,
          heading: 2,
          accuracy: 1,
          altitude: 10,
          at: 1,
          tws: 1,
          twa: 1,
          stw: 1,
        },
      ],
    };
    positionSubscriberAction(payload, headers);
    let positions = getAllPositions();
    expect(positions.length).toEqual(3);

    positionSubscriberAction(
      {
        id: '4',
        boat_id: 'boat4',
        race_id: 'race4',
        device_id: 'device4',
        position: '{lat: 123, lon: 123}',
        speed: 4,
        heading: 2,
        accuracy: 1,
        altitude: 10,
        at: 1,
        tws: 1,
        twa: 1,
        stw: 1,
      },
      {},
    );
    positions = getAllPositions();
    expect(positions.length).toEqual(4);
  });

  it('should not save non-position data', async () => {
    const headers = {
      isbatch: true,
    };
    const payload = {
      messages: [
        {
          id: '5',
          boat_id: 'boat5',
          race_id: 'race5',
          device_id: 'device5',
          position: '{lat: 123, lon: 123}',
          speed: 4,
          heading: 2,
          accuracy: 1,
          altitude: 10,
          at: 1,
          tws: 1,
          twa: 1,
          stw: 1,
        },
        {
          random_data: 1,
        },
      ],
    };
    positionSubscriberAction(payload, headers);
    const positions = getAllPositions();
    expect(positions.length).toEqual(5);
  });
});

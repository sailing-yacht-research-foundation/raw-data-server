const PointTrack = require('../pointTrack');
const { geometryType } = require('../../../syrf-schema/enums');

describe('PointTrack - Class to hold track data of a course point', () => {
  let track;
  const pointId = 'point1';
  beforeEach(() => {
    jest.clearAllMocks();
    track = new PointTrack(pointId);
  });
  describe('constructor', () => {
    it('should construct PointTrack correctly', async () => {
      expect(track.id).toEqual(pointId);
      expect(track.positions.length).toEqual(0);
    });
  });
  describe('addNewPosition', () => {
    it('should increase position array when new position is added', async () => {
      const trackLength = 2;
      const startDate = new Date().getTime();
      const initCount = track.positions.length;
      for (let i = 0; i < trackLength; i++) {
        track.addNewPosition([i, i], startDate + 1000 * i);
      }
      expect(track.positions.length).toEqual(initCount + trackLength);
    });
    it('should ignore multiple identical data', async () => {
      const trackLength = 5;
      const timestamp = new Date().getTime();
      const initialLength = track.positions.length;
      for (let i = 0; i < trackLength; i++) {
        track.addNewPosition([1, 1], timestamp);
      }
      expect(track.positions.length).toEqual(initialLength + 1);
    });
  });

  describe('createGeoJsonTrack', () => {
    it('should return LineString geojson of all positions', async () => {
      const positionCount = 10;
      const timestamp = new Date().getTime();
      const coordinateArray = [];
      for (let i = 0; i < positionCount; i++) {
        const time = timestamp + i * 1000;
        track.addNewPosition([1, i], time);
        coordinateArray.push([1, i, 0, time]);
      }
      const competitionUnitId = 'competition1';
      const result = track.createGeoJsonTrack({
        competitionUnitId,
      });
      expect(result).toEqual(
        expect.objectContaining({
          type: 'Feature',
          properties: {
            pointId: pointId,
            competitionUnitId,
          },
          geometry: {
            type: geometryType.LINESTRING,
            coordinates: coordinateArray,
          },
        }),
      );
    });
  });
});

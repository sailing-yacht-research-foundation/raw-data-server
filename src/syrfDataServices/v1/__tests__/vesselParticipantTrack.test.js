const VesselParticipantTrack = require('../vesselParticipantTrack');
const { INTERACTION_TRACK_LENGTH } = require('../../../constants');

describe('VesselParticipantTrack - Class to hold track data of a vessel', () => {
  let vesselTrack;
  const vesselId = 'vessel1';
  beforeEach(() => {
    jest.clearAllMocks();
    vesselTrack = new VesselParticipantTrack(vesselId);
  });
  describe('constructor', () => {
    it('should construct VesselParticipantTrack correctly', async () => {
      expect(vesselTrack.id).toEqual(vesselId);
      expect(vesselTrack.positions.length).toEqual(0);
    });
  });
  describe('addNewPosition', () => {
    it('should increase position array when new position is added and add new position data at the last array', async () => {
      const positionCount = 2;
      const timestamp = new Date().getTime();
      for (let i = 0; i < positionCount; i++) {
        expect(vesselTrack.positions.length).toEqual(i);
        vesselTrack.addNewPosition(
          [i, i],
          timestamp + i * 1000,
          { cog: 45, sog: 4, twa: -45 },
          { windSpeed: 5, windDirection: 0 },
        );
        expect(vesselTrack.positions.length).toEqual(i + 1);
        expect(vesselTrack.positions[i]).toEqual(
          expect.objectContaining({
            position: [i, i],
          }),
        );
      }
    });
  });

  describe('getSimplifiedTrack', () => {
    it('should return empty coordinates when less than 2 positions available', async () => {
      const timestamp = new Date().getTime();
      const positionData = {
        location: [0, 0],
        timestamp: timestamp,
        cog: 45,
        sog: 4,
        twa: -45,
        windSpeed: 5,
        windDirection: 0,
      };
      vesselTrack.addNewPosition(
        positionData.location,
        positionData.timestamp,
        { cog: positionData.cog, sog: positionData.sog, twa: positionData.twa },
        {
          windSpeed: positionData.windSpeed,
          windDirection: positionData.windDirection,
        },
      );
      const track = vesselTrack.getSimplifiedTrack();
      expect(track).toEqual({
        geometry: {
          coordinates: [],
          type: 'LineString',
        },
        properties: {},
        type: 'Feature',
      });
    });

    it('should return simplified track LineString', async () => {
      const positionData = [];
      const positionCount = INTERACTION_TRACK_LENGTH + 2;
      const timestamp = new Date().getTime();
      for (let i = 0; i < positionCount; i++) {
        positionData.push({
          location: [i, i],
          timestamp: timestamp + i * 1000,
          cog: 45,
          sog: 4,
          twa: -45,
          windSpeed: 5,
          windDirection: 0,
        });
      }
      positionData.forEach((row) => {
        const { cog, sog, twa, windSpeed, windDirection } = row;
        vesselTrack.addNewPosition(
          row.location,
          row.timestamp,
          { cog, sog, twa },
          { windSpeed, windDirection },
        );
      });
      const track = vesselTrack.getSimplifiedTrack();
      expect(track).toEqual({
        geometry: {
          coordinates: [
            [...positionData[0].location, 0, positionData[0].timestamp],
            [
              ...positionData[positionData.length - 1].location,
              0,
              positionData[positionData.length - 1].timestamp,
            ],
          ],
          type: 'LineString',
        },
        properties: {},
        type: 'Feature',
      });
    });

    it('should return full track LineString when simplification fails', async () => {
      const positionData = [];
      const positionCount = 4;
      const timestamp = new Date().getTime();
      for (let i = 0; i < positionCount; i++) {
        positionData.push({
          location: [20, 20], // Position needs to be the same to trigger error
          timestamp: timestamp + i * 1000,
          cog: 45,
          sog: 4,
          twa: -45,
          windSpeed: 5,
          windDirection: 0,
        });
      }
      positionData.forEach((row) => {
        const { cog, sog, twa, windSpeed, windDirection } = row;
        vesselTrack.addNewPosition(
          row.location,
          row.timestamp,
          { cog, sog, twa },
          { windSpeed, windDirection },
        );
      });

      const track = vesselTrack.getSimplifiedTrack();
      expect(track).toEqual({
        geometry: {
          coordinates: positionData.map((row) => {
            return [...row.location, 0, row.timestamp];
          }),
          type: 'LineString',
        },
        properties: {},
        type: 'Feature',
      });
    });
  });

  describe('createGeoJsonTrack', () => {
    it('should return LineString geojson of all positions', async () => {
      const positionCount = 10;
      const timestamp = new Date().getTime();
      for (let i = 0; i < positionCount; i++) {
        vesselTrack.addNewPosition([1, i], timestamp + i * 1000, { cog: 0 });
      }
      const result = vesselTrack.createGeoJsonTrack({
        competitionUnitId: 'competition1',
      });
      expect(result).toEqual(
        expect.objectContaining({
          providedGeoJson: expect.anything(),
          simplifiedGeoJson: expect.anything(),
        }),
      );
    });
  });
});

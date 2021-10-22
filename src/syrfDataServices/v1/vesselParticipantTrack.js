const turf = require('@turf/turf');
const { meterPerSecToKnots } = require('../../utils/gisUtils');

const geokdbush = require('geokdbush');
const { SIMPLIFICATION_TOLERANCE } = require('../../constants');
const KDBush = require('kdbush');

module.exports = class VesselParticipantTrack {
  constructor(id) {
    this.id = id;
    this.positions = [];
    this.lastIndexSaved = -1;
  }

  /**
   * Add new position
   * @param {Position} position from @turf/turf
   * @param {number} timestamp
   * @param {*} cog, sog, taw
   * @param {*} wind direction
   * @returns
   */
  addNewPosition(
    position,
    timestamp,
    { cog, sog, twa } = { cog: 0, sog: null, twa: null },
    { windSpeed, windDirection } = {
      windSpeed: undefined,
      windDirection: undefined,
    },
  ) {
    let posLength = this.positions.length;
    let prevPosition = null;
    while (posLength > 0) {
      if (this.positions[posLength - 1].timestamp === timestamp) {
        // Not populating prevPosition position data when timestamp is the same as last data
        // Track now mobile app sends multiple requests on the same data, which causes invalid calculated values
        break;
      }
      prevPosition = this.positions[posLength - 1];
      if (prevPosition.timestamp < timestamp) {
        break;
      }
      posLength--;
    }
    if (
      posLength !== this.positions.length &&
      this.lastIndexSaved > posLength
    ) {
      this.lastIndexSaved = posLength;
    }

    let trackData;
    if (prevPosition != null) {
      const derivedData = this.calculateDerivedData(
        { position: prevPosition.position, timestamp: prevPosition.timestamp },
        { position, timestamp },
        windDirection,
      );
      const { derivedCOG, derivedSOG, derivedTWA } = derivedData;
      trackData = {
        position,
        timestamp,
        cog,
        sog,
        twa,
        derivedCOG,
        derivedSOG,
        derivedTWA,
        windSpeed,
        windDirection,
      };
    } else {
      trackData = {
        position,
        timestamp,
        cog,
        sog,
        twa,
        windSpeed,
        windDirection,
      };
    }

    this.positions = [
      ...(posLength > 0 ? this.positions.slice(0, posLength) : []),
      trackData,
    ];

    return trackData;
  }

  calculateDerivedData(firstPoint, secondPoint, windDirection = undefined) {
    const derivedCOG = turf.bearingToAngle(
      turf.bearing(firstPoint.position, secondPoint.position),
    );
    const distanceFromPrev = turf.distance(
      firstPoint.position,
      secondPoint.position,
      {
        units: 'meters',
      },
    );
    const timeFromPrev = secondPoint.timestamp - firstPoint.timestamp;
    let derivedSOG = 0;
    if (timeFromPrev === 0) {
      // Prevent division by zero
      derivedSOG = (distanceFromPrev / timeFromPrev) * 1000; // m/s
    }
    derivedSOG = meterPerSecToKnots(derivedSOG);
    let derivedTWA;
    if (windDirection) {
      derivedTWA = turf.bearingToAngle(
        parseFloat((windDirection - derivedCOG).toFixed(2)),
      );
    }
    return {
      derivedCOG,
      derivedSOG,
      derivedTWA,
    };
  }
  /**
   *
   * @returns  Feature<LineString>
   */
  getSimplifiedTrack() {
    const coordinateWithTime = [];
    if (this.positions.length > 2) {
      // Turf Line String is unable to process less than 2 position
      const trackIndex = new KDBush(
        this.positions,
        (p) => p.position[0],
        (p) => p.position[1],
      );
      const lineString = turf.lineString(
        this.positions.map((row) => row.position),
      );
      let simplifiedTrack = { ...lineString };
      try {
        simplifiedTrack = turf.simplify(lineString, {
          mutate: false,
          highQuality: true,
          tolerance: SIMPLIFICATION_TOLERANCE,
        });
      } catch (error) {
        console.error(
          `Error simplifying tracks: ${error instanceof Error ? error.message : '-'
          }. Returning whole track`,
        );
        return {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: this.positions.map((row) => {
              return [...row.position, 0, row.timestamp];
            }),
          },
        };
      }
      // Need to consider points might repeat, so time must increases all the time
      let lastTime = 0;

      simplifiedTrack.geometry.coordinates.map((coord) => {
        const nearestData = geokdbush.around(trackIndex, coord[0], coord[1]);

        for (let i = 0; i < nearestData.length; i++) {
          const { position, timestamp } = nearestData[i];
          if (coord[0] !== position[0] || coord[1] !== position[1]) {
            // Should not reach here
            break;
          }
          if (
            coord[0] === position[0] &&
            coord[1] === position[1] &&
            timestamp > lastTime
          ) {
            coordinateWithTime.push([position[0], position[1], 0, timestamp]);
            break;
          }
        }
      });
    }
    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: coordinateWithTime,
      },
    };
  }

  /**
   *
   * @param {*} properties
   * @returns {providedGeoJson: VesselTrackGeoJson, calculatedGeoJson: VesselTrackGeoJson, simplifiedGeoJson: VesselTrackGeoJson }
   */
  createGeoJsonTrack({ competitionUnitId } = {}) {
    const providedGeoJson = {
      type: 'Feature',
      properties: {
        vesselParticipantId: this.id,
        competitionUnitId,
      },
      geometry: {
        type: 'LineString',
        coordinates: this.positions.map((row) => {
          const { position, timestamp, sog, cog, twa } = row;
          return [
            position[0],
            position[1],
            0,
            timestamp,
            sog || 0,
            cog || 0,
            twa || 0,
          ];
        }),
      },
    };
    const calculatedGeoJson = {
      type: 'Feature',
      properties: {
        vesselParticipantId: this.id,
        competitionUnitId,
      },
      geometry: {
        type: 'LineString',
        coordinates: this.positions.map((row) => {
          const {
            position,
            timestamp,
            derivedCOG,
            derivedSOG,
            derivedTWA,
            windDirection,
            windSpeed,
          } = row;
          return [
            position[0],
            position[1],
            0,
            timestamp,
            derivedSOG || 0,
            derivedCOG || 0,
            derivedTWA || 0,
            windSpeed || 0,
            windDirection || 0,
          ];
        }),
      },
    };
    const simplifiedGeoJson = {
      ...this.getSimplifiedTrack(),
      properties: {
        vesselParticipantId: this.id,
        competitionUnitId,
      },
    };
    return {
      providedGeoJson,
      calculatedGeoJson,
      simplifiedGeoJson,
    };
  }
};

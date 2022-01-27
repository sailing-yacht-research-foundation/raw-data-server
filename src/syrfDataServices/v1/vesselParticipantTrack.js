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
    { altitude, cog, sog, twa, windSpeed, windDirection, vmc, vmg } = {
      altitude: 0,
      cog: null,
      sog: null,
      twa: null,
      windSpeed: null,
      windDirection: null,
      vmc: null,
      vmg: null,
    },
  ) {
    const trackData = {
      position,
      timestamp,
      altitude,
      cog,
      sog,
      twa,
      windSpeed,
      windDirection,
      vmc,
      vmg,
    };
    this.positions.push(trackData);
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
          `Error simplifying tracks: ${
            error instanceof Error ? error.message : '-'
          }. Returning whole track`,
        );
        return {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: this.positions.map((row) => {
              return [...row.position, row.altitude || 0, row.timestamp];
            }),
          },
        };
      }
      // Need to consider points might repeat, so time must increases all the time
      let lastTime = 0;

      simplifiedTrack.geometry.coordinates.map((coord) => {
        const nearestData = geokdbush.around(trackIndex, coord[0], coord[1]);

        for (let i = 0; i < nearestData.length; i++) {
          const { position, timestamp, altitude } = nearestData[i];
          if (coord[0] !== position[0] || coord[1] !== position[1]) {
            // Should not reach here
            break;
          }
          if (
            coord[0] === position[0] &&
            coord[1] === position[1] &&
            timestamp > lastTime
          ) {
            coordinateWithTime.push([
              position[0],
              position[1],
              altitude || 0,
              timestamp,
            ]);
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
   * @returns {providedGeoJson: VesselTrackGeoJson, simplifiedGeoJson: VesselTrackGeoJson }
   */
  createGeoJsonTrack({ competitionUnitId } = {}) {
    const returnFiniteAndNotNull = (num, defaultVal) =>
      isFinite(num) && num !== null ? +num : defaultVal ?? null;
    const providedGeoJson = {
      type: 'Feature',
      properties: {
        vesselParticipantId: this.id,
        competitionUnitId,
      },
      geometry: {
        type: 'LineString',
        coordinates: this.positions.map((row) => {
          let {
            position,
            timestamp,
            sog,
            cog,
            twa,
            altitude,
            vmc,
            vmg,
            windSpeed,
          } = row;
          const geojsonData = [
            position[0],
            position[1],
            altitude || 0,
            timestamp,
          ];

          [sog, cog, twa, vmc, vmg, windSpeed] = [
            sog,
            cog,
            twa,
            vmc,
            vmg,
            windSpeed,
          ].map((i) => (i = returnFiniteAndNotNull(i)));

          if (sog !== null || cog !== null || twa !== null) {
            // only add these 3 if one of them is provided
            geojsonData.push(sog);
            geojsonData.push(cog);
            geojsonData.push(twa);
          }

          if (vmc !== null || vmg !== null || windSpeed !== null) {
            // only add these 3 if one of them is provided
            geojsonData.push(vmc);
            geojsonData.push(vmg);
            geojsonData.push(windSpeed);
          }
          return geojsonData;
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
      simplifiedGeoJson,
    };
  }
};

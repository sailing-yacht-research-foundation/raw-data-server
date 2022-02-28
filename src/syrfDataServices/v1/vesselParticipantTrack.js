const turf = require('@turf/turf');
const { meterPerSecToKnots } = require('../../utils/gisUtils');

const { SIMPLIFICATION_TOLERANCE } = require('../../constants');

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
  async getSimplifiedTrack() {
    console.time('getSimplifiedTrack');
    let coordinates = [];
    if (this.positions.length > 2) {
      // Turf Line String is unable to process less than 2 position
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

      let lastSearchIndex = 0;
      coordinates = await new Promise((resolve) => {
        const coordinateWithTime = [];
        simplifiedTrack.geometry.coordinates.map((coord) => {
          for (let i = lastSearchIndex; i < this.positions.length; i++) {
            if (
              this.positions[i].position[0] === coord[0] &&
              this.positions[i].position[1] === coord[1]
            ) {
              // Take this data
              const { position, altitude, timestamp } = this.positions[i];
              lastSearchIndex = i + 1;
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
        resolve(coordinateWithTime);
      });
    }
    console.timeEnd('getSimplifiedTrack');
    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates,
      },
    };
  }

  /**
   *
   * @param {*} properties
   * @returns {providedGeoJson: VesselTrackGeoJson, simplifiedGeoJson: VesselTrackGeoJson }
   */
  async createGeoJsonTrack({ competitionUnitId } = {}) {
    const returnFiniteAndNotNull = (num, defaultVal) =>
      isFinite(num) && num !== null ? +num : defaultVal ?? null;

    console.time('generate providedGeoJson');
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

          geojsonData.push(sog);
          geojsonData.push(cog);
          geojsonData.push(twa);

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
    console.timeEnd('generate providedGeoJson');
    const sTrack = await this.getSimplifiedTrack();
    const simplifiedGeoJson = {
      ...sTrack,
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

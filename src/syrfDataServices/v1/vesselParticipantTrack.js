const turf = require('@turf/turf');
const { geojsonProperties } = require('../../syrf-schema/enums');
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
    { altitude, cog, sog, twa, windSpeed, windDirection, vmc, vmg, heading } = {
      altitude: 0,
      cog: null,
      sog: null,
      twa: null,
      windSpeed: null,
      windDirection: null,
      vmc: null,
      vmg: null,
      heading: null,
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
      heading,
    };
    this.positions.push(trackData);
    return trackData;
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
    const geojsonPropSet = new Set([
      geojsonProperties.lon,
      geojsonProperties.lat,
      geojsonProperties.elevation,
      geojsonProperties.time,
    ]);
    const geojsonExtraProp = [
      geojsonProperties.sog,
      geojsonProperties.cog,
      geojsonProperties.twa,
      geojsonProperties.vmc,
      geojsonProperties.vmg,
      geojsonProperties.windSpeed,
      geojsonProperties.windDirection,
      geojsonProperties.heading,
    ];

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
          let { position, altitude, timestamp } = row;
          const geojsonData = [
            position[0],
            position[1],
            altitude || 0,
            timestamp,
          ];

          geojsonExtraProp.forEach((propName) => {
            const propValue = returnFiniteAndNotNull(row[propName]);
            if (propValue !== null && geojsonProperties[propName]) {
              geojsonPropSet.add(propName);
              geojsonData.push(propValue);
            }
          });

          return geojsonData;
        }),
      },
    };
    providedGeoJson.properties.detail = [...geojsonPropSet].reduce(
      (acc, i, index) => {
        acc[i] = index;
        return acc;
      },
      {},
    );

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

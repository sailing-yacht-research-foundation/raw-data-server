const { geometryType } = require('../../syrf-schema/enums');

module.exports = class PointTrack {
  constructor(id) {
    this.id = id;
    this.positions = [];
  }

  addNewPosition(position, timestamp) {
    if (
      this.positions.length > 0 &&
      this.positions[this.positions.length - 1].timestamp === timestamp
    ) {
      // Avoid pushing the data with the same timestamp
      this.positions[this.positions.length - 1] = { position, timestamp };
    } else {
      this.positions.push({ position, timestamp });
    }
  }

  createGeoJsonTrack({ competitionUnitId } = {}) {
    const feature = {
      type: 'Feature',
      properties: {
        pointId: this.id,
        competitionUnitId,
      },
      geometry: {
        type: geometryType.LINESTRING,
        coordinates: this.positions.map((row) => {
          const { position, timestamp } = row;
          return [position[0], position[1], 0, timestamp];
        }),
      },
    };
    return feature;
  }
};

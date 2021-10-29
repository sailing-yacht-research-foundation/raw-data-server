module.exports = class PointTrack {
  constructor(id, coordinate) {
    this.id = id;
    this.positions = [{ position: coordinate, timestamp: 0 }];
    this.lastIndexSaved = -1;
  }

  addNewPosition(position, timestamp) {
    if (
      this.positions.length > 0 &&
      this.positions[this.positions.length - 1].timestamp === timestamp
    ) {
      this.positions[this.positions.length - 1] = { position, timestamp };
    } else {
      this.positions = [...this.positions, { position, timestamp }];
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
        type: 'LineString',
        coordinates: this.positions.map((row) => {
          const { position, timestamp } = row;
          return [position[0], position[1], 0, timestamp];
        }),
      },
    };
    return feature;
  }
};

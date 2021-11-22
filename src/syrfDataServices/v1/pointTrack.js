module.exports = class PointTrack {
  constructor(id) {
    this.id = id;
    this.positions = [];
  }

  addNewPosition(position, timestamp) {
    this.positions.push({ position, timestamp });
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

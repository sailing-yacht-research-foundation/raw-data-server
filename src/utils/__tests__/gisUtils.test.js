const turf = require('@turf/turf');
const {
  getLatFromTurfPoint,
  getLonFromTurfPoint,
  createTurfPoint,
  findCenter,
  sortPositionsByTime,
  positionsToFeatureCollection,
  getCenterOfMassOfPositions,
  sortAllBoatPositionsByTime,
  createBoatToPositionDictionary,
  collectFirstNPositionsFromBoatsToPositions,
  collectLastNPositionsFromBoatsToPositions,
  findAverageLength,
  allPositionsToFeatureCollection,
  validateBoundingBox,
  createRace,
  pointToCountry,
  convertDMSToDD,
  parseGeoStringToDecimal,
} = require('../gisUtils');
const esUtil = require('../elasticsearch');

describe('gis_utils.js', () => {
  it('when getLonFromTurfPoint is called should return lon from turf point', () => {
    const lat = 38.8951;
    const lon = -77.0364;
    const point = turf.point([lon, lat]);
    const result = getLonFromTurfPoint(point);
    expect(result).toBe(lon);
  });
  it('when getLatFromTurfPoint is called should return lat from turf point', () => {
    const lat = 38.8951;
    const lon = -77.0364;
    const point = turf.point([lon, lat]);
    const result = getLatFromTurfPoint(point);
    expect(result).toBe(lat);
  });
  describe('when createTurfPoint is called', () => {
    it('should return an instance of turf point', () => {
      const lat = 38.8951;
      const lon = -77.0364;
      const p = createTurfPoint(lat, lon);
      expect(p.type).toBe('Feature');
      expect(p.geometry.type).toBe('Point');
      expect(p.geometry.coordinates[0]).toBe(lon);
      expect(p.geometry.coordinates[1]).toBe(lat);
    });
    it('should return an instance of turf point with string params', () => {
      const lat = '38.8951';
      const lon = '-77.0364';
      const p = createTurfPoint(lat, lon);
      expect(p.type).toBe('Feature');
      expect(p.geometry.type).toBe('Point');
      expect(p.geometry.coordinates[0]).toBe(parseFloat(lon));
      expect(p.geometry.coordinates[1]).toBe(parseFloat(lat));
    });
  });
  it('#findCenter should return middle turf point', () => {
    const lat1 = 1;
    const lon1 = 1;
    const lat2 = 2;
    const lon2 = 2;
    const p = findCenter(lat1, lon1, lat2, lon2);
    expect(p.type).toBe('Feature');
    expect(p.geometry.type).toBe('Point');
    const midp = turf.midpoint(
      turf.point([lon1, lat1]),
      turf.point([lon2, lat2]),
    );
    expect(p.geometry.coordinates[0]).toBe(midp.geometry.coordinates[0]);
    expect(p.geometry.coordinates[1]).toBe(midp.geometry.coordinates[1]);
  });
  it('#sortPositionsByTime should sort position array by time attribute', () => {
    const length = 5;
    const positions = [];
    for (let i = length; i > 0; i--) {
      positions.push({
        time: i,
        id: i,
      });
    }
    sortPositionsByTime('time', positions);
    for (let i = 0; i <= length - 1; i++) {
      expect(positions[i].id).toBe(i + 1);
      expect(positions[i].time).toBe(i + 1);
    }
  });
  it('#positionsToFeatureCollection should return a feature collection of positions', () => {
    const length = 5;
    const positions = [];
    for (let i = 1; i <= length; i++) {
      positions.push({
        id: i,
        lat: i,
        lon: i * 2,
      });
    }
    const r = positionsToFeatureCollection('lat', 'lon', positions);
    expect(r.type).toBe('FeatureCollection');
    r.features.forEach((f, i) => {
      expect(f.geometry.type).toBe('Point');
      expect(f.geometry.coordinates[0]).toBe(positions[i].lon);
      expect(f.geometry.coordinates[1]).toBe(positions[i].lat);
    });
  });
  it('#getCenterOfMassOfPositions should return center of mass of positions', () => {
    const length = 5;
    const positions = [];
    for (let i = 1; i <= length; i++) {
      positions.push({
        id: i,
        lat: i,
        lon: i * 2,
      });
    }
    const r = getCenterOfMassOfPositions('lat', 'lon', positions);
    const centerP = turf.centerOfMass(
      turf.featureCollection(positions.map((p) => turf.point([p.lon, p.lat]))),
    );
    expect(r.type).toBe('Feature');
    expect(r.geometry.type).toBe('Point');
    expect(r.geometry.coordinates[0]).toBe(centerP.geometry.coordinates[0]);
    expect(r.geometry.coordinates[1]).toBe(centerP.geometry.coordinates[1]);
  });
  it('#sortAllBoatPositionsByTime should sort boat positions by time attribute', () => {
    const boatIds = [1, 2];
    const boatPositions = {};
    const positions = [];
    const length = 5;
    for (let i = length; i > 0; i--) {
      positions.push({
        time: i,
        id: i,
      });
    }
    boatIds.forEach((bid) => {
      boatPositions[bid] = [...positions];
    });
    sortAllBoatPositionsByTime(boatPositions, 'time');
    boatIds.forEach((bid) => {
      expect(boatPositions[bid].length).toBe(length);
      for (let i = 0; i < length; i++) {
        expect(boatPositions[bid][i].id).toBe(i + 1);
        expect(boatPositions[bid][i].time).toBe(i + 1);
      }
    });
  });
  it('#createBoatToPositionDictionary should group positions by boat, and sort positions by time attribute', () => {
    const positions = [];
    const length = 5;
    for (let i = length; i > 0; i--) {
      positions.push({
        time: i,
        id: i,
        boat: 1,
      });
      positions.push({
        time: i,
        id: i,
        boat: 2,
      });
    }
    const result = createBoatToPositionDictionary(positions, 'boat', 'time');
    expect(result).toHaveProperty('1');
    expect(result['1'].length).toBe(length);
    expect(result).toHaveProperty('2');
    expect(result['2'].length).toBe(length);
    Object.keys(result).forEach((boat) => {
      for (let i = 0; i < result[boat].length - 1; i++) {
        expect(result[boat][i].time).toBeLessThan(result[boat][i + 1].time);
      }
    });
  });
  describe('#collectFirstNPositionsFromBoatsToPositions should return first N positions', () => {
    beforeAll(() => {
      this.boatPositions = {
        1: [],
        2: [],
      };
      this.length = 5;
      for (let i = 1; i <= this.length; i++) {
        Object.keys(this.boatPositions).forEach((boat) => {
          this.boatPositions[boat].push({
            time: i,
            id: i,
            boat,
          });
        });
      }
    });
    it('N < positions length', () => {
      const n = 3;
      const result = collectFirstNPositionsFromBoatsToPositions(
        this.boatPositions,
        n,
      );
      expect(result.length).toBe(n * 2);
      for (let i = 1; i <= n; i++) {
        // position from first boat
        expect(result[i - 1].id).toEqual(i);

        // position from second boat
        expect(result[i - 1 + n].id).toEqual(i);
      }
    });
    it('N > positions length', () => {
      const n = this.length + 1;
      const result = collectFirstNPositionsFromBoatsToPositions(
        this.boatPositions,
        n,
      );
      expect(result.length).toBe(2 * this.length);
      for (let i = 1; i <= this.length; i++) {
        // position from first boat
        expect(result[i - 1].id).toEqual(i);

        // position from second boat
        expect(result[i - 1 + this.length].id).toEqual(i);
      }
    });
  });
  describe('#collectLastNPositionsFromBoatsToPositions should return last N positions', () => {
    beforeAll(() => {
      this.boatPositions = {
        1: [],
        2: [],
      };
      this.length = 5;
      for (let i = 1; i <= this.length; i++) {
        Object.keys(this.boatPositions).forEach((boat) => {
          this.boatPositions[boat].push({
            time: i,
            id: i,
            boat,
          });
        });
      }
    });
    it('N < positions length', () => {
      const n = 3;
      const result = collectLastNPositionsFromBoatsToPositions(
        this.boatPositions,
        n,
      );
      expect(result.length).toBe(n * 2);
      for (let i = 1; i <= n; i++) {
        // position from first boat
        expect(result[i - 1].id).toBe(this.length - i + 1);

        // position from second boat
        expect(result[i - 1 + n].id).toBe(this.length - i + 1);
      }
    });
    it('N > positions length', () => {
      const n = this.length + 1;
      const result = collectLastNPositionsFromBoatsToPositions(
        this.boatPositions,
        n,
      );
      expect(result.length).toBe(2 * this.length);
      for (let i = 1; i <= this.length; i++) {
        // position from first boat
        expect(result[i - 1].id).toEqual(i);

        // position from second boat
        expect(result[i - 1 + this.length].id).toEqual(i);
      }
    });
  });
  it('#findAverageLength should return average length of boat positions', () => {
    const boatPositions = {
      1: [],
      2: [],
    };
    let positions = [];
    let length = 0;
    for (let i = 1; i <= 5; i++) {
      const p = {
        id: i,
        lat: i,
        lon: i * 2,
      };
      boatPositions[1].push(p);
      positions.push([p.lon, p.lat]);
    }
    length += turf.length(turf.lineString(positions));

    positions = [];
    for (let i = 1; i <= 3; i++) {
      const p = {
        id: i,
        lat: i + 1,
        lon: i * 3,
      };
      boatPositions[2].push(p);
      positions.push([p.lon, p.lat]);
    }
    length += turf.length(turf.lineString(positions));
    const avgLength = length / 2;

    const r = findAverageLength('lat', 'lon', boatPositions);
    expect(r).toBe(avgLength);
  });
  it('#allPositionsToFeatureCollection should return feature collection of boat positions', () => {
    const boatPositions = {
      1: [],
      2: [],
    };
    for (let i = 1; i <= 5; i++) {
      boatPositions[1].push({
        id: i,
        lat: i,
        lon: i * 2,
        timestamp: i,
      });
      boatPositions[2].push({
        id: i,
        lat: i + 1,
        lon: i * 3,
        timestamp: i,
      });
    }
    const boatLines = {
      1: boatPositions[1].map((p) => [p.lon, p.lat, 0, p.timestamp]),
      2: boatPositions[2].map((p) => [p.lon, p.lat, 0, p.timestamp]),
    };
    const r = allPositionsToFeatureCollection(boatPositions);
    expect(r.type).toBe('FeatureCollection');
    expect(r.features.length).toBe(2);

    expect(r.features[0].geometry.type).toBe('LineString');
    expect(r.features[0].properties.id).toBe('1');
    expect(r.features[0].geometry.coordinates).toEqual(boatLines[1]);

    expect(r.features[1].geometry.type).toBe('LineString');
    expect(r.features[1].properties.id).toBe('2');
    expect(r.features[1].geometry.coordinates).toEqual(boatLines[2]);
  });
  describe('#validateBoundingBox should validate box within a specific bounding', () => {
    beforeAll(() => {
      this.boundingBox = [-180, 85, 180, -85];
      this.nonPolarRegion = turf.bboxPolygon(this.boundingBox);
      this.distanceRatioLimit = 80;
    });
    it('should return true if box is within bounding and not narrow', () => {
      const box = [10, 60, 100, 0];
      const isNonPolar = turf.booleanContains(
        this.nonPolarRegion,
        turf.bboxPolygon(box),
      );
      expect(isNonPolar).toBe(true);
      const r = validateBoundingBox(box);
      expect(r).toBe(true);
    });
    it('should return false if box is outside of bounding', () => {
      const box = [10, 60, 200, 10];
      const isNonPolar = turf.booleanContains(
        this.nonPolarRegion,
        turf.bboxPolygon(box),
      );
      expect(isNonPolar).toBe(false);
      const r = validateBoundingBox(box);
      expect(r).toBe(false);
    });
    it('should return false if box is within bounding but narrow', () => {
      const box = [10, 80, 11, -80];
      const isNonPolar = turf.booleanContains(
        this.nonPolarRegion,
        turf.bboxPolygon(box),
      );
      expect(isNonPolar).toBe(true);
      const r = validateBoundingBox(box);
      expect(r).toBe(false);
    });
  });
  it('#createRace should create and return correct race meta data', async () => {
    const indexRaceSpy = jest.spyOn(esUtil, 'indexRace').mockResolvedValue({});

    const id = 'testraceid';
    const name = 'Race 1';
    const event = 'event1';
    const source = 'racesource';
    const url = 'https://someurl.com';
    const startTimeMs = new Date().getTime() - 7 * 24 * 3600 * 1000;
    const endTimeMs = startTimeMs + 2 * 24 * 3600 * 1000;
    const startDate = new Date(startTimeMs);
    const startYear = startDate.getUTCFullYear();
    const startMonth = startDate.getUTCMonth() + 1;
    const startDay = startDate.getUTCDate();
    const bbox = [10, 60, 100, 0];
    const bounding = turf.bboxPolygon(bbox);
    const boundingBox = bounding.geometry;
    boundingBox.crs = {
      type: 'name',
      properties: {
        name: 'EPSG:4326',
      },
    };
    const approxAreaSqKm = turf.area(bounding) / 1000000;
    const roughDistanceKm = 0;
    const startPoint = turf.point([11, 10]);
    const approxStartPoint = startPoint.geometry;
    approxStartPoint.crs = {
      type: 'name',
      properties: {
        name: 'EPSG:4326',
      },
    };
    const endPoint = turf.point([99, 40]);
    const approxEndPoint = endPoint.geometry;
    approxEndPoint.crs = {
      type: 'name',
      properties: {
        name: 'EPSG:4326',
      },
    };
    const approxMidPoint = turf.midpoint(startPoint, endPoint).geometry;
    approxMidPoint.crs = {
      type: 'name',
      properties: {
        name: 'EPSG:4326',
      },
    };
    const startCountry = pointToCountry(startPoint);
    const positionsLength = 100;
    const positions = [];
    let runningDiffCount = 0;
    for (let i = 0; i < positionsLength; i++) {
      let time;
      if (i === 0) {
        time = startTimeMs;
      } else {
        const diff = 2000 + i * 200;
        time = positions[i - 1].timestamp + diff;
        runningDiffCount += diff;
      }
      positions.push({
        id: i,
        timestamp: time,
      });
    }
    const avgTimeBetweenPositions = runningDiffCount / positionsLength;
    const boatIdsToPositions = { 1: positions };
    const boatNames = ['boat1'];
    const boatModels = ['model1'];
    const boatIdentifiers = ['aaa'];
    const handicapRules = ['bbb'];
    const unstructuredText = ['tttt'];
    const gc = turf.greatCircle(startPoint, endPoint);
    const approxDistanceKm = turf.length(gc);
    let greatCircle = null;
    if (gc.geometry.type === 'LineString') {
      greatCircle = turf.multiLineString([gc.geometry.coordinates]).geometry;
    } else {
      greatCircle = gc.geometry;
    }
    greatCircle.crs = {
      type: 'name',
      properties: {
        name: 'EPSG:4326',
      },
    };

    const r = await createRace(
      id,
      name,
      event,
      source,
      url,
      startTimeMs,
      endTimeMs,
      startPoint,
      endPoint,
      bbox,
      roughDistanceKm,
      boatIdsToPositions,
      boatNames,
      boatModels,
      boatIdentifiers,
      handicapRules,
      unstructuredText,
    );

    const expectedResult = {
      id,
      name,
      event,
      source,
      url,
      start_country: startCountry,
      start_year: startYear,
      start_month: startMonth,
      start_day: startDay,
      approx_start_time_ms: startTimeMs,
      approx_end_time_ms: endTimeMs,
      approx_duration_ms: endTimeMs - startTimeMs,
      approx_start_point: approxStartPoint,
      approx_start_lat: startPoint.geometry.coordinates[1],
      approx_start_lon: startPoint.geometry.coordinates[0],
      approx_end_point: approxEndPoint,
      approx_end_lat: endPoint.geometry.coordinates[1],
      approx_end_lon: endPoint.geometry.coordinates[0],
      approx_mid_point: approxMidPoint,
      bounding_box: boundingBox,
      approx_area_sq_km: approxAreaSqKm,
      approx_distance_km: approxDistanceKm,
      num_boats: Object.keys(boatIdsToPositions).length,
      avg_time_between_positions: avgTimeBetweenPositions,
      boat_models: boatModels,
      handicap_rules: handicapRules,
      great_circle: greatCircle,
    };
    expect(r).toEqual(expectedResult);

    const expectedIndexedBody = {
      id,
      name,
      event,
      source,
      url,
      start_country: startCountry,
      start_year: startYear,
      start_month: startMonth,
      start_day: startDay,
      approx_start_time_ms: startTimeMs,
      approx_end_time_ms: endTimeMs,
      approx_duration_ms: endTimeMs - startTimeMs,
      approx_start_point: approxStartPoint,
      approx_mid_point: approxMidPoint,
      approx_end_point: approxEndPoint,
      bounding_box: boundingBox,
      approx_area_sq_km: approxAreaSqKm,
      approx_distance_km: approxDistanceKm,
      num_boats: Object.keys(boatIdsToPositions).length,
      avg_time_between_positions: avgTimeBetweenPositions,
      boat_models: boatModels,
      boat_identifiers: boatIdentifiers,
      boat_names: boatNames,
      handicap_rules: handicapRules,
      unstructured_text: unstructuredText,
    };
    expect(indexRaceSpy).toHaveBeenCalledWith(id, expectedIndexedBody);
  });

  it('#convertDMSToDD should convert the  DMS parts into Decimal', () => {
    const degrees = '35';
    const minutes = '57';
    const seconds = '9';
    const direction = 'N';
    const result = convertDMSToDD(degrees, minutes, seconds, direction);
    expect(typeof result).toBe('number');
    expect(result.toFixed(2)).toBe('35.95');
  });

  it('#parseGeoStringToDecimal should convert the  DMS string into Decimal', () => {
    const result = parseGeoStringToDecimal(`36°57'9" N`);
    expect(typeof result).toBe('number');
    expect(result.toFixed(2)).toBe('36.95');
  });
});

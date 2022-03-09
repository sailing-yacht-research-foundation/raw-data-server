const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const { createGeometryPoint } = require('../../utils/gisUtils');
const elasticsearch = require('../../utils/elasticsearch');
const {
  positionsToFeatureCollection,
  getCenterOfMassOfPositions,
  getCountryAndCity,
  getLatFromTurfPoint,
  getLonFromTurfPoint,
  validateBoundingBox,
} = require('../../utils/gisUtils');
const turf = require('@turf/turf');

const mapAndSave = async (data, raceMetadata) => {
  console.log('Saving to main database');

  const inputBoats = _mapBoats(data.boats);

  const inputPositions = _mapPositions(data.positions);

  const metadata = await _recalculateMetadata(inputPositions, raceMetadata);

  const mappedSequencedGeometries = _mapSequencedGeometries(inputPositions);

  await saveToAwsElasticSearch(data, raceMetadata);
  await saveCompetitionUnit({
    race: {
      id: data.race.id,
      url: data.race.url,
      name: data.race.name,
      original_id: '',
    },
    boats: inputBoats,
    positions: inputPositions,
    courseSequencedGeometries: mappedSequencedGeometries,
    reuse: {
      boats: true,
    },
    raceMetadata: metadata,
  });
};

const _mapBoats = (boats) => {
  return boats.map((b) => {
    const vessel = {
      id: b.id,
      vesselId: `${b.name}_${b.class}`,
      model: b.class,
      publicName: b.name,
    };
    return vessel;
  });
};

const _mapPositions = (positions) => {
  //if there are positions bellow 12 latitude needs to be offseted
  let shouldOffset = false;

  if (
    positions[0].lat < 10 &&
    positions[0].lat > -10 &&
    positions[0].lon > -10 &&
    positions[0].lon < 10
  ) {
    shouldOffset = true;
  }

  return positions.map((p) => ({
    timestamp: p.timestamp < 99999999999 ? p.timestamp * 1000 : p.timestamp,
    lon: shouldOffset ? p.lon * 10 : p.lon,
    lat: shouldOffset ? p.lat * 10 : p.lat,
    vesselId: p.boat_id,
  }));
};

const _mapSequencedGeometries = (positions) => {
  const courseSequencedGeometries = [];

  const firstPos = positions[0];
  const startPoint = createGeometryPoint({
    lat: firstPos.lat,
    lon: firstPos.lon,
    properties: { name: 'Start' },
  });
  startPoint.order = 0;
  courseSequencedGeometries.push(startPoint);

  const lastPos = positions[positions.length - 1];
  const endPoint = createGeometryPoint({
    lat: lastPos.lat,
    lon: lastPos.lon,
    properties: { name: 'Finish' },
  });
  endPoint.order = 1;
  courseSequencedGeometries.push(endPoint);

  return courseSequencedGeometries;
};

const saveToAwsElasticSearch = async (data, raceMetadata) => {
  const names = [];
  const models = [];
  const identifiers = [];

  data.boats.forEach((b) => {
    if (b.name) {
      names.push(b.name);
    }

    if (b.class) {
      models.push(b.class);
    }

    if (b.id) {
      identifiers.push(b.id);
    }
  });

  const body = {
    id: data.race.id,
    name: raceMetadata.name,
    event: raceMetadata.event,
    source: raceMetadata.source,
    url: raceMetadata.url,
    start_country: raceMetadata.start_country,
    start_city: raceMetadata.start_city,
    start_year: Number(raceMetadata.start_year),
    start_month: Number(raceMetadata.start_month),
    start_day: Number(raceMetadata.start_day),
    approx_start_time_ms: Number(raceMetadata.approx_start_time_ms),
    approx_end_time_ms: Number(raceMetadata.approx_end_time_ms),
    approx_duration_ms: Number(raceMetadata.approx_duration_ms),
    approx_start_point: raceMetadata.approx_start_point,
    approx_end_point: raceMetadata.approx_end_point,
    approx_mid_point: raceMetadata.approx_mid_point,
    bounding_box: raceMetadata.bounding_box,
    approx_area_sq_km: raceMetadata.approx_area_sq_km,
    approx_distance_km: raceMetadata.approx_distance_km,
    num_boats: raceMetadata.num_boats,
    avg_time_between_positions: raceMetadata.avg_time_between_positions,
    boat_models: models,
    boat_identifiers: identifiers,
    boat_names: names,
    handicap_rules: raceMetadata.handicap_rules,
    unstructured_text: [],
  };

  await elasticsearch.indexRace(data.race.id, body);
};

const _recalculateMetadata = async (positions, raceMetadata) => {
  const first3Positions = _firstPositions(positions, 3);
  const startPoint = getCenterOfMassOfPositions('lat', 'lon', first3Positions);

  const last3Positions = _lastPositions(positions, 3);
  const endPoint = getCenterOfMassOfPositions('lat', 'lon', last3Positions);

  const approxStartPoint = startPoint === null ? null : startPoint.geometry;
  const approxEndPoint = endPoint === null ? null : endPoint.geometry;
  const approxMidPoint = turf.midpoint(startPoint, endPoint).geometry;

  if (approxStartPoint !== null) {
    approxStartPoint.crs = {
      type: 'name',
      properties: {
        name: 'EPSG:4326',
      },
    };
  }

  approxEndPoint.crs = {
    type: 'name',
    properties: {
      name: 'EPSG:4326',
    },
  };

  approxMidPoint.crs = {
    type: 'name',
    properties: {
      name: 'EPSG:4326',
    },
  };

  const approxStartLat = getLatFromTurfPoint(startPoint);
  const approxStartLon = getLonFromTurfPoint(startPoint);
  const approxEndLat = getLatFromTurfPoint(endPoint);
  const approxEndLon = getLonFromTurfPoint(endPoint);

  const bbox = turf.bbox(positionsToFeatureCollection('lat', 'lon', positions));

  let boundingBox = null;

  if (validateBoundingBox(bbox)) {
    const bounding = turf.bboxPolygon(bbox);
    boundingBox = bounding.geometry;
    boundingBox.crs = {
      type: 'name',
      properties: {
        name: 'EPSG:4326',
      },
    };
  }

  const { countryName: startCountry, cityName: startCity } =
    await getCountryAndCity({
      lon: startPoint.geometry.coordinates[0],
      lat: startPoint.geometry.coordinates[1],
    });

  return {
    ...raceMetadata,
    start_country: startCountry,
    start_city: startCity,
    approx_start_point: approxStartPoint,
    approx_start_lat: approxStartLat,
    approx_start_lon: approxStartLon,
    approx_end_point: approxEndPoint,
    approx_end_lat: approxEndLat,
    approx_end_lon: approxEndLon,
    approx_mid_point: approxMidPoint,
    bounding_box: boundingBox,
  };
};

const _firstPositions = (positions, count) => {
  const pos = [];
  count = positions.length < count ? positions.length : count;

  if (positions.length >= count) {
    for (let i = 0; i < count; ++i) {
      pos.push(positions[i]);
    }
  }

  return pos;
};

const _lastPositions = (positions, count) => {
  const pos = [];
  count = positions.length < count ? positions.length : count;

  if (positions.length >= count) {
    for (let i = positions.length - 1; count; --i) {
      pos.push(positions[i]);
      --count;
    }
  }

  return pos;
};

module.exports = mapAndSave;

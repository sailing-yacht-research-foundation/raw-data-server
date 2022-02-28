const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const { createGeometryPoint } = require('../../utils/gisUtils');
const elasticsearch = require('../../utils/elasticsearch');

const mapAndSave = async (data, raceMetadata) => {
  console.log('Saving to main database');

  const inputBoats = _mapBoats(data.boats);

  const inputPositions = _mapPositions(data.positions);

  const mappedSequencedGeometries = _mapSequencedGeometries(raceMetadata);

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
    raceMetadata,
  });
};

const _mapBoats = (boats) => {
  return boats.map((b) => {
    const vessel = {
      id: b.id,
      vesselId: b.name + b.class,
      model: b.class,
      publicName: b.name,
    };
    return vessel;
  });
};

const _mapPositions = (positions) => {
  return positions.map((p) => ({
    timestamp: p.timestamp,
    lon: p.lon,
    lat: p.lat,
    vesselId: p.boat_id,
  }));
};

const _mapSequencedGeometries = (raceMetadata) => {
  const courseSequencedGeometries = [];

  const startPoint = createGeometryPoint({
    lat: raceMetadata.approx_start_lat,
    lon: raceMetadata.approx_start_lon,
    properties: { name: 'Start' },
  });
  startPoint.order = 0;
  courseSequencedGeometries.push(startPoint);

  const endPoint = createGeometryPoint({
    lat: raceMetadata.approx_end_lat,
    lon: raceMetadata.approx_end_lon,
    properties: { name: 'end' },
  });
  endPoint.order = 1;
  courseSequencedGeometries.push(endPoint);

  return courseSequencedGeometries;
};

const saveToAwsElasticSearch = async (data, raceMetadata) => {
  const body = {
    id: data.race.id,
    name: raceMetadata.name,
    event: raceMetadata.event,
    source: raceMetadata.source,
    url: raceMetadata.url,
    start_country: raceMetadata.start_country,
    start_city: raceMetadata.start_city,
    start_year: raceMetadata.start_year,
    start_month: raceMetadata.start_month,
    start_day: raceMetadata.start_day,
    approx_start_time_ms: raceMetadata.approx_start_time_ms,
    approx_end_time_ms: raceMetadata.approx_end_time_ms,
    approx_duration_ms: raceMetadata.approx_duration_ms,
    approx_start_point: raceMetadata.approx_start_point,
    approx_start_lat: raceMetadata.approx_start_lat,
    approx_start_lon: raceMetadata.approx_start_lon,
    approx_end_point: raceMetadata.approx_end_point,
    approx_end_lat: raceMetadata.approx_end_lat,
    approx_end_lon: raceMetadata.approx_end_lon,
    approx_mid_point: raceMetadata.approx_mid_point,
    approx_area_sq_km: raceMetadata.approx_area_sq_km,
    approx_distance_km: raceMetadata.approx_distance_km,
    num_boats: raceMetadata.num_boats,
    avg_time_between_positions: raceMetadata.avg_time_between_positions,
    open_graph_image: raceMetadata.open_graph_image,
  };

  await elasticsearch.indexRace(data.race.id, body);
};

module.exports = mapAndSave;

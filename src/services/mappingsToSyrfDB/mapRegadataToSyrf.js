const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const { createGeometryPoint } = require('../../utils/gisUtils');
const elasticsearch = require('../../utils/elasticsearch');

const mapAndSave = async (data, raceMetadata) => {
  console.log('Saving to main database');
  const inputBoats = _mapBoats(data.sails);

  const inputPositions = _mapPositions(data.reports);

  const mappedSequencedGeometries = _mapSequencedGeometries(raceMetadata);

  await saveToAwsElasticSearch(data, raceMetadata);

  await saveCompetitionUnit({
    race: data.race,
    boats: inputBoats,
    positions: inputPositions,
    courseSequencedGeometries: mappedSequencedGeometries,
    raceMetadata,
    reuse: {
      boats: true,
    },
  });
};

const _mapBoats = (boats) => {
  return boats.map((b) => {
    const crewName = b.skipper;

    const vessel = {
      id: b.id,
      vesselId: b.original_id,
      model: b.class,
      publicName: b.boat,
    };

    if (crewName) {
      vessel.crews = [
        {
          publicName: crewName,
        },
      ];
    }

    return vessel;
  });
};

const _mapPositions = (positions) => {
  return positions.map((p) => ({
    timestamp: p.timestamp * 1000,
    lon: p.lon_dec,
    lat: p.lat_dec,
    cog: p['1hour_heading'],
    sog: p['1hour_speed'],
    vesselId: p.sail_id,
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
  const names = [];
  const models = [];
  const identifiers = [];
  const unstructuredText = [];

  data.sails.forEach((b) => {
    if (b.boat) {
      names.push(b.boat);
    }

    if (b.class) {
      models.push(b.class);
    }

    if (b.sail) {
      identifiers.push(b.sail);
    }

    if (b.boat2) {
      unstructuredText.push(b.boat2);
    }
    if (b.skipper) {
      unstructuredText.push(b.skipper);
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
    unstructured_text: unstructuredText,
  };

  await elasticsearch.indexRace(data.race.id, body);
};
module.exports = mapAndSave;

const turf = require('@turf/turf');
const uuid = require('uuid');
const elasticsearch = require('./elasticsearch');
const uploadUtil = require('../services/uploadUtil');
const { createMapScreenshot } = require('./createMapScreenshot');
const cities = require('all-the-cities');
const KDBush = require('kdbush');
const geokdbush = require('geokdbush');
const { reverseGeoCode } = require('../syrfDataServices/v1/googleAPI');
const { geometryType } = require('../syrf-schema/enums');

const { world } = require('./world');
const cityIndex = new KDBush(
  cities,
  (p) => p.loc.coordinates[0],
  (p) => p.loc.coordinates[1],
);

exports.filterHandicaps = function (handicaps) {
  const filtered = [];
  handicaps.forEach((h) => {
    filtered.push(h);

    // Portsmouth Yardstick, German Yardstick, SCHRS , Unknown, One Design, CBH, International Rule, PHS,dHhC, AMS, LEVEL, TCF, DFS, CSA, WCC, SL-DTF, DFS, IOR, RORC, IRC, ORC, PHRF
  });
  return filtered;
};

exports.filterList = function (list) {
  const filtered = {};
  list.forEach((item) => {
    if (
      typeof item === 'string' &&
      item !== 'null' &&
      item !== '' &&
      item !== '-' &&
      item !== 'undefined' &&
      item !== 'class' &&
      item !== 'NONE'
    ) {
      const itemTemp = item;
      const item2 = itemTemp
        .replace('"', '')
        .replace('Womens', '')
        .replace('WOMENS', '')
        .replace('womens', '')
        .replace('Mens', '')
        .replace('mens', '')
        .replace('MENS', '')
        .replace('Women', '')
        .replace('WOMEN', '')
        .replace('women', '')
        .replace('Men', '')
        .replace('men', '')
        .replace('MEN', '');

      const key = item2.replace('_', ' ').replace('"', '').trim();

      filtered[key] = item2;
    }
  });
  return Object.keys(filtered);
};

exports.getLonFromTurfPoint = function (point) {
  return point.geometry.coordinates[0];
};
exports.getLatFromTurfPoint = function (point) {
  return point.geometry.coordinates[1];
};

exports.createTurfPoint = function (lat, lon) {
  if (lat === null || lon === null) {
    return null;
  }
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);
  return turf.point([longitude, latitude]);
};

exports.findCenter = function (lat1, lon1, lat2, lon2) {
  const a = exports.createTurfPoint(lat1, lon1);
  const b = exports.createTurfPoint(lat2, lon2);
  return turf.midpoint(a, b);
};

exports.sortPositionsByTime = function (timeFieldName, positions) {
  positions.sort((a, b) => (a[timeFieldName] > b[timeFieldName] ? 1 : -1));
};

exports.positionsToFeatureCollection = function (
  latFieldName,
  lonFieldName,
  positions,
) {
  const points = [];
  positions.forEach((p) => {
    const point = exports.createTurfPoint(p[latFieldName], p[lonFieldName]);
    if (point !== null) {
      points.push(point);
    }
  });
  return turf.featureCollection(points);
};

exports.getCenterOfMassOfPositions = function (
  latFieldName,
  lonFieldName,
  positions,
) {
  return turf.centerOfMass(
    exports.positionsToFeatureCollection(latFieldName, lonFieldName, positions),
  );
};

exports.createBoatToPositionDictionary = function (
  allPositions,
  boatIdFieldName,
  timeFieldName,
) {
  const boatsToPositions = {};
  allPositions.forEach((p) => {
    if (boatsToPositions[p[boatIdFieldName]] === undefined) {
      boatsToPositions[p[boatIdFieldName]] = [];
    }
    boatsToPositions[p[boatIdFieldName]].push(p);
  });

  exports.sortAllBoatPositionsByTime(boatsToPositions, timeFieldName);
  return boatsToPositions;
};

exports.sortAllBoatPositionsByTime = function (
  boatsToPositions,
  timeFieldName,
) {
  const keys = Object.keys(boatsToPositions);
  keys.forEach((key) => {
    const positions = boatsToPositions[key];
    exports.sortPositionsByTime(timeFieldName, positions);
  });
};

exports.collectFirstNPositionsFromBoatsToPositions = function (
  boatsToPositions,
  n,
) {
  const keys = Object.keys(boatsToPositions);
  const positions = [];
  keys.forEach((k) => {
    const positionsForKey = boatsToPositions[k];
    if (positionsForKey.length > n) {
      let index = 0;
      while (index < n) {
        positions.push(positionsForKey[index]);
        index++;
      }
    } else {
      let index = 0;
      while (index < positionsForKey.length) {
        positions.push(positionsForKey[index]);
        index++;
      }
    }
  });
  return positions;
};

exports.collectLastNPositionsFromBoatsToPositions = function (
  boatsToPositions,
  n,
) {
  const keys = Object.keys(boatsToPositions);
  const positions = [];
  keys.forEach((k) => {
    const positionsForKey = boatsToPositions[k];
    if (positionsForKey.length > n) {
      let index = positionsForKey.length - 1;
      let count = 0;
      while (count < n) {
        positions.push(positionsForKey[index]);
        index--;
        count++;
      }
    } else {
      let index = 0;
      while (index < positionsForKey.length) {
        positions.push(positionsForKey[index]);
        index++;
      }
    }
  });
  return positions;
};

exports.findAverageLength = function (latField, lonField, boatIdsToPositions) {
  const boatIds = Object.keys(boatIdsToPositions);
  let lengthCount = 0;
  let numBoats = 0;

  boatIds.forEach((boat) => {
    const positions = boatIdsToPositions[boat];

    const positionsArray = [];
    positions.forEach((p) => {
      if (p[lonField] !== null && p[latField] !== null) {
        const point = [p[lonField], p[latField]];
        positionsArray.push(point);
      }
    });
    if (positionsArray.length > 1) {
      const line = turf.lineString(positionsArray);
      lengthCount = lengthCount + turf.length(line);
      numBoats++;
    }
  });
  return lengthCount / numBoats;
};

// This function assumes positions have lat, lon and timestamp in ms properties.
exports.allPositionsToFeatureCollection = function (boatIdsToPositions) {
  const boatIds = Object.keys(boatIdsToPositions);
  const lines = [];

  boatIds.forEach((boat) => {
    const positions = boatIdsToPositions[boat];

    const positionsArray = [];
    positions.forEach((p) => {
      if (p.lon !== null && p.lat !== null && p.timestamp !== null) {
        const point = [p.lon, p.lat, 0, p.timestamp];
        positionsArray.push(point);
      }
    });

    if (positionsArray.length > 1) {
      const line = turf.lineString(positionsArray, { id: boat });
      lines.push(line);
    }
  });
  return turf.featureCollection(lines);
};

exports.validateBoundingBox = function (bbox) {
  const minX = bbox[0];
  const minY = bbox[1];
  const maxX = bbox[2];
  const maxY = bbox[3];

  const limit = 80;

  const tl = exports.createTurfPoint(minY, minX);
  const tr = exports.createTurfPoint(minY, maxX);
  const bl = exports.createTurfPoint(maxY, minX);

  const horizontalDistance = turf.distance(tl, tr);
  const verticalDistance = turf.distance(tl, bl);

  const nonPolarRect = [-180, 85, 180, -85];
  const nonPolarRegion = turf.bboxPolygon(nonPolarRect);
  const isNonPolar = turf.booleanContains(
    nonPolarRegion,
    turf.bboxPolygon(bbox),
  );
  const isNotNarrow =
    horizontalDistance / verticalDistance < limit &&
    horizontalDistance / verticalDistance > 1 / limit;
  return isNonPolar && isNotNarrow;
};

exports.generateMetadataName = (eventName, raceName, startTimeMs) => {
  eventName = eventName?.trim();
  raceName = raceName?.trim();
  let name;
  if (eventName === raceName) {
    name = eventName;
  } else {
    name = [eventName?.replace(/_/g, ' '), raceName?.replace(/_/g, ' ')]
      .filter(Boolean)
      .join(' - ');
  }
  if (!name) {
    // if no event or race name
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'long',
      timeZone: 'utc',
    });
    name = `Race at ${dateFormatter.format(startTimeMs)}`; //Example: Race at Oct 11, 2021, 2:32:46 PM GMT+8
  }
  return name;
};

exports.createRace = async function (
  id,
  raceName,
  eventName,
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
  skipElasticSearch = false,
) {
  let name = exports.generateMetadataName(eventName, raceName, startTimeMs);

  const { countryName: startCountry, cityName: startCity } =
    await reverseGeoCode({
      lon: startPoint.geometry.coordinates[0],
      lat: startPoint.geometry.coordinates[1],
    });
  let openGraphImage = null;
  try {
    const imageBuffer = await createMapScreenshot(
      startPoint.geometry.coordinates,
    );
    const response = await uploadUtil.uploadDataToS3({
      ACL: 'public-read',
      Bucket: process.env.OPEN_GRAPH_BUCKET_NAME,
      Key: `public/competition/${id}/${uuid.v4()}.png`,
      Body: imageBuffer,
      ContentEncoding: 'base64',
      ContentType: 'image/png',
    });
    openGraphImage = response?.Location;
  } catch (error) {
    // Logging only, if not successfully created, we can skip the open graph image
    console.error(
      `Failed to create mapshot for scraped race: ${id}, error: ${error.message}`,
    );
  }

  const startDate = new Date(startTimeMs);

  const startYear = startDate.getUTCFullYear();
  const startMonth = startDate.getUTCMonth() + 1;
  const startDay = startDate.getUTCDate();
  const approxStartTimeMs = startTimeMs;
  const approxEndTimeMs = endTimeMs;
  const approxDurationMs = approxEndTimeMs - approxStartTimeMs;

  const approxStartPoint = startPoint === null ? null : startPoint.geometry;
  const approxEndPoint = endPoint === null ? null : endPoint.geometry;

  let boundingBox = null;
  let approxAreaSqKm = 0;

  if (exports.validateBoundingBox(bbox)) {
    const bounding = turf.bboxPolygon(bbox);
    boundingBox = bounding.geometry;
    boundingBox.crs = {
      type: 'name',
      properties: {
        name: 'EPSG:4326',
      },
    };
    approxAreaSqKm = turf.area(bounding) / 1000000;
  }

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

  const gc = turf.greatCircle(startPoint, endPoint);
  let approxDistanceKm = roughDistanceKm;
  try {
    approxDistanceKm = turf.length(gc);
  } catch (err) {
    // Do nothing.
    approxDistanceKm = roughDistanceKm;
  }
  if (isNaN(approxDistanceKm)) {
    approxDistanceKm = roughDistanceKm;
  }
  const numBoats = Object.keys(boatIdsToPositions).length;
  const arbitraryPositionList =
    boatIdsToPositions[Object.keys(boatIdsToPositions)[0]];
  let runningDifferenceCount = 0;
  const numberPositions = arbitraryPositionList.length;
  for (let index = 1; index < arbitraryPositionList.length; index++) {
    runningDifferenceCount =
      runningDifferenceCount +
      (arbitraryPositionList[index].timestamp -
        arbitraryPositionList[index - 1].timestamp);
  }

  const avgTimeBetweenPositions = runningDifferenceCount / numberPositions;

  const boatModelsFiltered = exports.filterList(boatModels);

  const handicapRulesFiltered = exports.filterHandicaps(
    exports.filterList(handicapRules),
  );

  const approxStartLat = exports.getLatFromTurfPoint(startPoint);
  const approxStartLon = exports.getLonFromTurfPoint(startPoint);
  const approxEndLat = exports.getLatFromTurfPoint(endPoint);
  const approxEndLon = exports.getLonFromTurfPoint(endPoint);
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
  // Remove NaN in greatCircle values
  greatCircle.coordinates = greatCircle.coordinates.map((v1) => {
    return v1
      .map((v2) => v2.filter((v3) => !isNaN(v3)))
      .filter((i) => i.length === 2);
  });
  if (
    greatCircle.coordinates === 0 ||
    greatCircle.coordinates[0].length === 0
  ) {
    greatCircle = null;
  }
  const raceMetadata = {
    id,
    name,
    event,
    source,
    url,
    start_country: startCountry,
    start_city: startCity,
    start_year: startYear,
    start_month: startMonth,
    start_day: startDay,
    approx_start_time_ms: approxStartTimeMs,
    approx_end_time_ms: approxEndTimeMs,
    approx_duration_ms: approxDurationMs,
    approx_start_point: approxStartPoint,
    approx_start_lat: approxStartLat,
    approx_start_lon: approxStartLon,
    approx_end_point: approxEndPoint,
    approx_end_lat: approxEndLat,
    approx_end_lon: approxEndLon,
    approx_mid_point: approxMidPoint,
    bounding_box: boundingBox,
    approx_area_sq_km: approxAreaSqKm,
    approx_distance_km: approxDistanceKm,
    num_boats: numBoats,
    avg_time_between_positions: avgTimeBetweenPositions,
    boat_models: boatModels,
    handicap_rules: handicapRulesFiltered,
    great_circle: greatCircle,
    open_graph_image: openGraphImage,
  };

  // Only used by ElasticSearch
  if (!skipElasticSearch) {
    const boatIdentifiersFiltered = exports.filterList(boatIdentifiers);
    const boatNamesFiltered = exports.filterList(boatNames);

    const body = {
      id,
      name,
      event,
      source,
      url,
      start_country: startCountry,
      start_city: startCity,
      start_year: startYear,
      start_month: startMonth,
      start_day: startDay,
      approx_start_time_ms: approxStartTimeMs,
      approx_end_time_ms: approxEndTimeMs,
      approx_duration_ms: approxDurationMs,
      approx_start_point: approxStartPoint,
      approx_mid_point: approxMidPoint,
      approx_end_point: approxEndPoint,
      bounding_box: boundingBox,
      approx_area_sq_km: approxAreaSqKm,
      approx_distance_km: approxDistanceKm,
      num_boats: numBoats,
      avg_time_between_positions: avgTimeBetweenPositions,
      boat_models: boatModelsFiltered,
      boat_identifiers: boatIdentifiersFiltered,
      boat_names: boatNamesFiltered,
      handicap_rules: handicapRules,
      unstructured_text: unstructuredText,
    };

    await elasticsearch.indexRace(id, body);
  }
  return raceMetadata;
};

const convertDMSToDD = function (degrees, minutes, seconds, direction) {
  var dd = Number(degrees) + Number(minutes) / 60 + Number(seconds) / (60 * 60);

  if (direction == 'S' || direction == 'W') {
    dd = dd * -1;
  } // Don't do anything for N or E
  return dd;
};

exports.convertDMSToDD = convertDMSToDD;

/**
 * Sample input format 36°57'9" N
 * When You have different format.
 * For example: 45 04.70' N
 * You should replace the (.) by ' '.
 * To make sure the string split function operates correctly
 * @param {*} input
 * @returns
 */
exports.parseGeoStringToDecimal = function (input) {
  var parts = input.split(/[^\d\w.]+/);
  return convertDMSToDD(parts[0], parts[1], parts[2], parts[3]);
};

/**
 * Convert m/s speed to kts
 * @param {Number} speed
 * @returns
 */
exports.meterPerSecToKnots = function (speed) {
  // 1 m/s = 1.943844 kn
  return parseFloat((speed * 1.943844).toFixed(2));
};

exports.createGeometryPoint = ({
  lat,
  lon,
  properties = {},
  markTrackerId = null,
}) => {
  return {
    geometryType: geometryType.POINT,
    properties,
    coordinates: [this.createGeometryPosition({ lat, lon, markTrackerId })],
  };
};

exports.createGeometryLine = (
  { lat: point1Lat, lon: point1lon, markTrackerId: point1TrackerId },
  { lat: point2Lat, lon: point2Lon, markTrackerId: point2TrackerId },
  properties = {},
) => {
  return {
    geometryType: geometryType.LINESTRING,
    properties,
    coordinates: [
      this.createGeometryPosition({
        lat: point1Lat,
        lon: point1lon,
        markTrackerId: point1TrackerId,
      }),
      this.createGeometryPosition({
        lat: point2Lat,
        lon: point2Lon,
        markTrackerId: point2TrackerId,
      }),
    ],
  };
};

exports.createGeometryPosition = ({ lat, lon, markTrackerId }) => {
  return {
    position: [lon, lat],
    markTrackerId,
  };
};

/**
 *
 * @param {Array of {lon, lat}} coordinates
 * @param {*} properties
 * @returns
 */
exports.createGeometryPolygon = (coordinates = [], properties = {}) => {
  return {
    geometryType: geometryType.POLYGON,
    properties,
    coordinates,
  };
};

exports.createGeometry = (coordinates = [], properties = {}, geometryType) => {
  return {
    geometryType,
    properties,
    coordinates,
  };
};

exports.pointToCountry = ({ lon, lat }) => {
  const point = [lon, lat];
  let minDistance = 10000;
  let countryName = '';
  let found = false;
  world.features.forEach((country) => {
    const poly = country.geometry;
    const vertices = turf.explode(poly);
    const closestVertex = turf.nearest(point, vertices);
    const distance = turf.distance(point, closestVertex);
    if (!found) {
      if (turf.booleanPointInPolygon(point, poly)) {
        found = true;
        countryName = country.properties.ADMIN;
      } else if (distance < minDistance) {
        minDistance = distance;
        countryName = country.properties.ADMIN;
      }
    }
  });
  return countryName;
};

exports.pointToCity = ({ lon, lat }) => {
  const point = [lon, lat];
  const nearestCity = geokdbush.around(cityIndex, point[0], point[1], 1);
  return nearestCity[0].name;
};

exports.getCountryAndCity = async ({ lon, lat }) => {
  let { countryName, cityName } = await reverseGeoCode({
    lon,
    lat,
  });
  if (!countryName) {
    countryName = exports.pointToCountry({ lon, lat });
  }
  if (!cityName) {
    cityName = exports.pointToCity({ lon, lat });
  }
  return { countryName, cityName };
};

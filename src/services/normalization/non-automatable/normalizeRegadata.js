const turf = require('@turf/turf');
const db = require('../../../models');
const {
  createBoatToPositionDictionary,
  positionsToFeatureCollection,
  collectFirstNPositionsFromBoatsToPositions,
  collectLastNPositionsFromBoatsToPositions,
  getCenterOfMassOfPositions,
  findAverageLength,
  createRace,
  allPositionsToFeatureCollection,
} = require('../../../utils/gisUtils');
const uploadUtil = require('../../uploadUtil');

const normalizeRegadata = async (
  { regadataRace, regaDataSails, regadataReports },
  transaction,
) => {
  const SOURCE = 'REGADATA';
  const race = regadataRace;
  const boatPositions = regadataReports
    .filter((t) => t.lat_dec && t.lon_dec && t.timestamp)
    .map((t) => {
      return {
        ...t,
        // convert unix timestamp
        timestamp: t.timestamp * 1000,
        lat: t.lat_dec,
        lon: t.lon_dec,
      };
    });
  const boats = regaDataSails;

  if (!race) {
    console.log('No race is detected. Skipping');
  }
  if (!race || !boatPositions?.length) {
    console.log(`No boat position for ${race.original_id}. Skipping`);
    return;
  }

  const raceNamePrefix = race.original_id.replace(/[0-9]+.+/g, '').split('');
  const raceNameSuffix = race.original_id.replace(raceNamePrefix.join(''), '');
  raceNamePrefix[0] = raceNamePrefix[0].toUpperCase();
  // For example: 'vor2014'. raceNamePrefix = 'vor', raceNameSuffix = '2014'. name will be 'Vor - 2014'
  const name = `${raceNamePrefix.join('')} - ${raceNameSuffix}`;
  let startTime;
  let endTime;
  for (const report of boatPositions) {
    if (!startTime || report.timestamp < startTime) {
      startTime = report.timestamp;
    }
    if (!endTime || report.timestamp > endTime) {
      endTime = report.timestamp;
    }
  }

  console.log(
    `Race = ${name}, startTime = ${startTime}, endTime = ${endTime}, boatPositions = ${boatPositions.length}`,
  );

  const boatsToSortedPositions = createBoatToPositionDictionary(
    boatPositions,
    'sail',
    'timestamp',
  );
  const first3Positions = collectFirstNPositionsFromBoatsToPositions(
    boatsToSortedPositions,
    3,
  );
  const startPoint = getCenterOfMassOfPositions('lat', 'lon', first3Positions);
  const last3Positions = collectLastNPositionsFromBoatsToPositions(
    boatsToSortedPositions,
    3,
  );
  const endPoint = getCenterOfMassOfPositions('lat', 'lon', last3Positions);

  const boundingBox = turf.bbox(
    positionsToFeatureCollection('lat', 'lon', boatPositions),
  );
  const boatNames = [];
  const boatModels = [];
  const handicapRules = [];
  const boatIdentifiers = [];
  const unstructuredText = [];
  const event = null;
  boats?.forEach((b) => {
    if (b.boat) {
      boatNames.push(b.boat);
    }
    if (b.class) {
      boatModels.push(b.class);
    }
    boatIdentifiers.push(b.sail);
    if (b.boat2) {
      unstructuredText.push(b.boat2);
    }
    if (b.skipper) {
      unstructuredText.push(b.skipper);
    }
  });

  const roughLength = findAverageLength('lat', 'lon', boatsToSortedPositions);

  console.log(
    `race.id = ${race.id}, name = ${name}, event = ${event}, SOURCE = ${SOURCE} startime = ${startTime}, endTimne = ${endTime}`,
  );

  const raceMetadata = await createRace(
    race.id,
    name,
    event,
    SOURCE,
    '', // url
    startTime,
    endTime,
    startPoint,
    endPoint,
    boundingBox,
    roughLength,
    boatsToSortedPositions,
    boatNames,
    boatModels,
    boatIdentifiers,
    handicapRules,
    unstructuredText,
    true, // Skip elastic search for now since race does not have url
  );

  const tracksGeojson = JSON.stringify(
    allPositionsToFeatureCollection(boatsToSortedPositions),
  );

  const metadata = await db.readyAboutRaceMetadata.findOne({
    where: {
      id: raceMetadata.id,
    },
    raw: true,
  });

  if (!metadata) {
    await db.readyAboutRaceMetadata.create(raceMetadata, {
      fields: Object.keys(raceMetadata),
      transaction,
    });
    console.log('uploading geojson');
    await uploadUtil.uploadGeoJsonToS3(
      race.id,
      tracksGeojson,
      SOURCE,
      transaction,
    );
  }
  return raceMetadata;
};

exports.normalizeRegadata = normalizeRegadata;

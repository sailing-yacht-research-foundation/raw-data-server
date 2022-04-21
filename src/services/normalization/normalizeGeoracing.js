const turf = require('@turf/turf');
const {
  createBoatToPositionDictionary,
  positionsToFeatureCollection,
  collectFirstNPositionsFromBoatsToPositions,
  collectLastNPositionsFromBoatsToPositions,
  getCenterOfMassOfPositions,
  findAverageLength,
  createRace,
  createTurfPoint,
} = require('../../utils/gisUtils');

const normalizeRace = async ({
  GeoracingEvent,
  GeoracingRace,
  GeoracingActor,
  GeoracingPosition,
  GeoracingCourseObject,
  GeoracingCourseElement,
  GeoracingLine,
}) => {
  const GEORACING_SOURCE = 'GEORACING';
  const eventObj = GeoracingEvent?.[0];
  const raceMetadatas = [];
  const esBodies = [];

  let actorPositions = GeoracingPosition?.filter(
    (p) => p.trackable_type === 'actor' && !!p.lat && !!p.lon && !!p.timestamp,
  );

  if (!GeoracingRace || !actorPositions || actorPositions.length === 0) {
    throw new Error('No race or positions so skipping.');
  }

  for (const race of GeoracingRace) {
    const id = race.id;
    const url = race.url;
    const startTime = new Date(race.start_time).getTime();
    const endTime = new Date(race.end_time).getTime();
    const boatNames = [];
    const boatModels = [];
    const handicapRules = [];
    const boatIdentifiers = [];
    const unstructuredText = [];
    unstructuredText.push(race.short_description);

    const actors = GeoracingActor;
    const allPositions = actorPositions.filter(
      (p) => p.race_original_id === race.original_id,
    );
    if (allPositions.length === 0) {
      console.log('No race positions so skipping.');
      continue;
    }
    const courseObjects = GeoracingCourseObject?.filter(
      (p) => p.race_original_id === race.original_id,
    );
    const courseElements = GeoracingCourseElement?.filter(
      (p) => p.race_original_id === race.original_id,
    );
    const lines = GeoracingLine?.filter(
      (p) => p.race_original_id === race.original_id,
    );

    actors.forEach((a) => {
      boatIdentifiers.push(a.start_number);
      boatNames.push(a.name);
      boatModels.push(a.model);
    });
    const fc = positionsToFeatureCollection('lat', 'lon', allPositions);
    const boundingBox = turf.bbox(fc);
    const boatsToSortedPositions = createBoatToPositionDictionary(
      allPositions,
      'trackable_id',
      'timestamp',
    );
    const first3Positions = collectFirstNPositionsFromBoatsToPositions(
      boatsToSortedPositions,
      3,
    );
    let startPoint = getCenterOfMassOfPositions('lat', 'lon', first3Positions);
    const last3Positions = collectLastNPositionsFromBoatsToPositions(
      boatsToSortedPositions,
      3,
    );
    let endPoint = getCenterOfMassOfPositions('lat', 'lon', last3Positions);

    for (const coIndex in courseObjects) {
      const co = courseObjects[coIndex];
      if (
        co.name === 'Finish' ||
        co.name === 'Arrivée' ||
        co.name === 'Arrivee'
      ) {
        const courseElement = courseElements.find(
          (ce) => ce.course_object_original_id === co.id,
        );

        if (
          !!courseElement &&
          !!courseElement.latitude &&
          !!courseElement.longitude
        ) {
          endPoint = createTurfPoint(
            courseElement.latitude,
            courseElement.longitude,
          );
        }
      }
    }

    lines?.forEach((lineT) => {
      if (
        lineT.name.toLowerCase() === '"arrivee"' ||
        lineT.name.toLowerCase() === '"arrivée"'
      ) {
        const coords = lineT.points.split('\r\n');
        let last = coords[coords.length - 1];
        if (last === '') {
          last = coords[coords.length - 2];
        }
        if (last.includes(',')) {
          const lat = last.split(',')[1];
          const lon = last.split(',')[0];
          endPoint = createTurfPoint(lat, lon);
        } else if (last.includes(';')) {
          const lat = last.split(';')[1];
          const lon = last.split(';')[0];
          endPoint = createTurfPoint(lat, lon);
        }
      } else if (lineT.name.toLowerCase() === '"départ"') {
        const coords = lineT.points.split('\r\n');
        const first = coords[0];
        if (first.includes(',')) {
          const latf = first.split(',')[1];
          const lonf = first.split(',')[0];
          startPoint = createTurfPoint(latf, lonf);
        } else if (first.includes(';')) {
          const latf = first.split(';')[1];
          const lonf = first.split(';')[0];
          startPoint = createTurfPoint(latf, lonf);
        }
      } else if (lineT.name.toLowerCase() === '"orthodromie"') {
        const coords = lineT.points.split('\r\n');
        let last = coords[coords.length - 1];
        if (last === '') {
          last = coords[coords.length - 2];
        }
        if (last.includes(',')) {
          const lat = last.split(',')[1];
          const lon = last.split(',')[0];
          endPoint = createTurfPoint(lat, lon);
        } else if (last.includes(';')) {
          const lat = last.split(';')[1];
          const lon = last.split(';')[0];
          endPoint = createTurfPoint(lat, lon);
        }

        const first = coords[0];
        if (first.includes(',')) {
          const latf = first.split(',')[1];
          const lonf = first.split(',')[0];
          startPoint = createTurfPoint(latf, lonf);
        } else if (first.includes(';')) {
          const latf = first.split(';')[1];
          const lonf = first.split(';')[0];
          startPoint = createTurfPoint(latf, lonf);
        }
      }
    });

    const roughLength = findAverageLength('lat', 'lon', boatsToSortedPositions);
    const { raceMetadata, esBody } = await createRace(
      id,
      race.name,
      eventObj?.name,
      eventObj?.id,
      GEORACING_SOURCE,
      url,
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
    );
    raceMetadatas.push(raceMetadata);
    esBodies.push(esBody);
  }
  return { raceMetadatas, esBodies };
};

exports.normalizeRace = normalizeRace;

const turf = require('@turf/turf');
const {
  createBoatToPositionDictionary,
  positionsToFeatureCollection,
  collectFirstNPositionsFromBoatsToPositions,
  collectLastNPositionsFromBoatsToPositions,
  getCenterOfMassOfPositions,
  findAverageLength,
  createRace,
  findCenter,
} = require('../../utils/gisUtils');
const markIdentifiers = new Set(['Mark', 'Marker', 'CourseMark']);

const normalizeRace = async ({
  TackTrackerRace,
  TackTrackerPosition,
  TackTrackerStart,
  TackTrackerFinish,
  TackTrackerBoat,
}) => {
  const TACKTRACKER_SOURCE = 'TACKTRACKER';
  const raceMetadatas = [];
  const esBodies = [];

  if (
    !TackTrackerRace ||
    !TackTrackerPosition ||
    TackTrackerPosition.length === 0
  ) {
    throw new Error('No race or positions so skipping.');
  }

  for (const race of TackTrackerRace) {
    let allPositions = TackTrackerPosition.filter(
      (p) => p.race === race.id && p.lat && p.lon,
    );
    if (allPositions.length === 0) {
      console.log('No race positions so skipping.');
      continue;
    }
    const startMark = TackTrackerStart?.filter((s) => s.race === race.id)?.[0];
    const finishMark = TackTrackerFinish?.filter(
      (f) => f.race === race.id,
    )?.[0];
    const boats = TackTrackerBoat.filter(
      (b) => b.race === race.id && !markIdentifiers.has(b.unknown_4),
    );
    const id = race.id;
    const startTime = new Date(race.start).getTime();
    let endTime;
    const name = race.name;
    const regattaId = race.regatta;
    const url = race.url;

    const boatNames = [];
    const boatModels = [];
    const boatIdentifiers = [];
    const handicapRules = [];
    const unstructuredText = [];

    const boatIds = new Set();
    boats.forEach((b) => {
      boatNames.push(b.name);
      boatIds.add(b.id);
    });

    allPositions = allPositions.filter((t) => boatIds.has(t.boat));
    allPositions.forEach((p) => {
      p.timestamp = new Date(p.time).getTime();
      if (!endTime || endTime < p.timestamp) {
        endTime = p.timestamp;
      }
    });

    const boundingBox = turf.bbox(
      positionsToFeatureCollection('lat', 'lon', allPositions),
    );
    const boatsToSortedPositions = createBoatToPositionDictionary(
      allPositions,
      'boat',
      'timestamp',
    );

    const _setFirstMarkPosition = (markObject, { latKey, lonKey, nameKey }) => {
      if (+markObject[latKey] === 0 && +markObject[lonKey] === 0) {
        const markBoat = TackTrackerBoat.find(
          (b) => b.race === race.id && b.name === markObject[nameKey],
        );
        if (!markBoat) {
          return;
        }
        const markFirstPos = TackTrackerPosition.find(
          (p) => p.race === race.id && p.boat === markBoat.id,
        );
        if (markFirstPos) {
          markObject[latKey] = markFirstPos.lat;
          markObject[lonKey] = markFirstPos.lon;
        }
      }
    };

    let startPoint;
    if (startMark && startMark.start_mark_lat) {
      _setFirstMarkPosition(startMark, {
        latKey: 'start_mark_lat',
        lonKey: 'start_mark_lon',
        nameKey: 'start_mark_name',
      });
      _setFirstMarkPosition(startMark, {
        latKey: 'start_pin_lat',
        lonKey: 'start_pin_lon',
        nameKey: 'start_pin_name',
      });
      startPoint = findCenter(
        startMark.start_mark_lat,
        startMark.start_mark_lon,
        startMark.start_pin_lat,
        startMark.start_pin_lon,
      );
    }

    if (
      !startPoint ||
      (startPoint.geometry.coordinates[0] === 0 &&
        startPoint.geometry.coordinates[1] === 0)
    ) {
      const first3Positions = collectFirstNPositionsFromBoatsToPositions(
        boatsToSortedPositions,
        3,
      );
      startPoint = getCenterOfMassOfPositions('lat', 'lon', first3Positions);
    }

    let endPoint;
    if (finishMark) {
      _setFirstMarkPosition(finishMark, {
        latKey: 'finish_mark_lat',
        lonKey: 'finish_mark_lon',
        nameKey: 'finish_mark_name',
      });
      _setFirstMarkPosition(finishMark, {
        latKey: 'finish_pin_lat',
        lonKey: 'finish_pin_lon',
        nameKey: 'finish_pin_name',
      });
      endPoint = findCenter(
        finishMark.finish_mark_lat,
        finishMark.finish_mark_lon,
        finishMark.finish_pin_lat,
        finishMark.finish_pin_lon,
      );
    } else {
      const last3Positions = collectLastNPositionsFromBoatsToPositions(
        boatsToSortedPositions,
        3,
      );
      endPoint = getCenterOfMassOfPositions('lat', 'lon', last3Positions);
    }

    const roughLength = findAverageLength('lat', 'lon', boatsToSortedPositions);
    const { raceMetadata, esBody } = await createRace(
      id,
      name,
      null, // event name. TackTracker's regatta has no name
      regattaId,
      TACKTRACKER_SOURCE,
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

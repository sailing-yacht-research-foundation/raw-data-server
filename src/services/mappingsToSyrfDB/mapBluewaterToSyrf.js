const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const { FEET_TO_METERS } = require('../../constants');
const {
  createGeometryPoint,
  createGeometryLine,
} = require('../../utils/gisUtils');

const mapAndSave = async (data, raceMetadata) => {
  console.log('Saving to main database');
  // vessels
  const boatIdToOriginalIdMap = {};
  const inputBoats = _mapBoats(
    data.BluewaterBoat,
    data.BluewaterCrew,
    data.BluewaterBoatHandicap,
    boatIdToOriginalIdMap,
  );

  // positions
  const inputPositions = _mapPositions(
    data.BluewaterPosition,
    boatIdToOriginalIdMap,
  );

  // marks
  let courseSequencedGeometries;
  const bluewaterMap = data.BluewaterMap?.[0];
  if (bluewaterMap) {
    courseSequencedGeometries = _mapSequencedGeometries(bluewaterMap);
  }

  await saveCompetitionUnit({
    race: data.BluewaterRace.map((r) => ({ ...r, url: r.referral_url }))[0],
    boats: inputBoats,
    positions: inputPositions,
    raceMetadata,
    courseSequencedGeometries,
  });
};

const _mapBoats = (boats, crews, raceHandicaps, boatIdToOriginalIdMap) => {
  return boats?.map((b) => {
    boatIdToOriginalIdMap[b.original_id] = b.id;
    const vessel = {
      id: b.id,
      publicName: b.name,
      globalId: b.sail_no,
      vesselId: b.original_id,
      model: b.design,
      lengthInMeters: b.length,
      widthInMeters: b.width,
      draftInMeters: b.draft,
    };
    if (b.units === 'feet') {
      vessel.lengthInMeters =
        vessel.lengthInMeters * FEET_TO_METERS || vessel.lengthInMeters;
      vessel.widthInMeters =
        vessel.widthInMeters * FEET_TO_METERS || vessel.widthInMeters;
      vessel.draftInMeters =
        vessel.draftInMeters * FEET_TO_METERS || vessel.draftInMeters;
    }

    // Boat Crew
    vessel.crews = crews
      ?.filter((c) => c.boat === b.id)
      .map((c) => ({
        id: c.id,
        publicName: [c.last_name, c.first_name].filter(Boolean).join(', '),
      }));

    // Handicap
    const boatHandicaps = raceHandicaps.filter((h) => h.boat === b.id);
    vessel.handicap = {};
    boatHandicaps.forEach((h) => {
      vessel.handicap[h.name] = h.rating;
    });
    return vessel;
  });
};

const _mapPositions = (positions, boatIdToOriginalIdMap) => {
  return positions?.map((p) => ({
    ...p,
    vesselId: boatIdToOriginalIdMap[p.boat_original_id],
  }));
};

const _mapSequencedGeometries = (bluewaterMap) => {
  const courseSequencedGeometries = [];
  if (bluewaterMap.start_line) {
    try {
      const startLine = JSON.parse(bluewaterMap.start_line);
      const line = createGeometryLine(
        {
          lat: startLine[0][1],
          lon: startLine[0][0],
        },
        {
          lat: startLine[1][1],
          lon: startLine[1][0],
        },
        { name: 'Start Line' },
      );
      line.order = 0;
      courseSequencedGeometries.push(line);
    } catch (err) {
      console.log('Invalid start_line', err);
    }
  }

  if (bluewaterMap.course) {
    try {
      const coursePoints = JSON.parse(bluewaterMap.course);
      coursePoints.forEach((pt, index) => {
        const newPoint = createGeometryPoint(pt[1], pt[0], {
          name: `Course Point ${index + 1}`,
        });
        newPoint.order = index + 1;
        courseSequencedGeometries.push(newPoint);
      });
    } catch (err) {
      console.log(`Invalid course points`, err);
    }
  }

  if (bluewaterMap.finish_line) {
    try {
      const finishLine = JSON.parse(bluewaterMap.finish_line);
      const line = createGeometryLine(
        {
          lat: finishLine[0][1],
          lon: finishLine[0][0],
        },
        {
          lat: finishLine[1][1],
          lon: finishLine[1][0],
        },
        { name: 'Finish Line' },
      );
      line.order = courseSequencedGeometries.length;
      courseSequencedGeometries.push(line);
    } catch (err) {
      console.log('Invalid finish_line', err);
    }
  }
  return courseSequencedGeometries;
};

module.exports = mapAndSave;

const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const { FEET_TO_METERS } = require('../../constants');
const {
  createGeometryPoint,
  createGeometryLine,
} = require('../../utils/gisUtils');

const mapAndSave = async (data, raceMetadata) => {
  if (
    !raceMetadata ||
    !data.BluewaterRace?.length ||
    !data.BluewaterBoat?.length ||
    !data.BluewaterPosition?.length
  ) {
    console.log('Missing data');
    console.log(
      `raceMetadata ${raceMetadata}, data.BluewaterRace?.length ${data.BluewaterRace?.length}, data.BluewaterBoat?.length ${data.BluewaterBoat?.length}, !data.BluewaterPosition?.length ${data.BluewaterPosition?.length}`,
    );
    return;
  }
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

  return await saveCompetitionUnit({
    race: data.BluewaterRace.map((r) => ({
      ...r,
      url: r.referral_url,
      scrapedUrl: r.slug,
    }))[0],
    boats: inputBoats,
    positions: inputPositions,
    raceMetadata,
    courseSequencedGeometries,
    reuse: {
      boats: true,
    },
    competitionUnitData: {
      handicap: data.BluewaterBoatHandicap
        ? [
            ...data.BluewaterBoatHandicap.reduce((acc, h) => {
              if (h.name) {
                acc.add(h.name);
              }
              return acc;
            }, new Set()),
          ]
        : null,
    },
  });
};

const _mapBoats = (boats, crews, raceHandicaps, boatIdToOriginalIdMap) => {
  return boats?.map((b) => {
    boatIdToOriginalIdMap[b.original_id] = b.id;
    const vessel = {
      id: b.id,
      publicName: b.name,
      globalId: b.sail_no,
      sailNumber: b.sail_no,
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
    const boatHandicaps = raceHandicaps?.filter((h) => h.boat === b.id);
    vessel.handicap = {};
    boatHandicaps?.forEach((h) => {
      vessel.handicap[h.name] = h.rating;
    });
    return vessel;
  });
};

const _mapPositions = (positions, boatIdToOriginalIdMap) => {
  return positions?.map((p) => ({
    timestamp: new Date(p.date).getTime(),
    lon: +p.coordinate_0,
    lat: +p.coordinate_1,
    cog: +p.cog,
    sog: +p.sog,
    vesselId: boatIdToOriginalIdMap[p.boat_original_id],
  }));
};

const _mapSequencedGeometries = (bluewaterMap) => {
  const courseSequencedGeometries = [];
  if (bluewaterMap.start_line) {
    try {
      const startLine = JSON.parse(bluewaterMap.start_line);
      if (startLine?.length) {
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
      }
    } catch (err) {
      console.log('Invalid start_line', err);
    }
  }

  if (bluewaterMap.course) {
    try {
      const coursePoints = JSON.parse(bluewaterMap.course);
      coursePoints.forEach((pt, index) => {
        const newPoint = createGeometryPoint({
          lat: pt[1],
          lon: pt[0],
          properties: {
            name: `Course Point ${index + 1}`,
          },
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
      if (finishLine?.length) {
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
      }
    } catch (err) {
      console.log('Invalid finish_line', err);
    }
  }
  return courseSequencedGeometries;
};

module.exports = mapAndSave;

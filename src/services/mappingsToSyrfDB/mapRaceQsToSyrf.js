const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const gisUtils = require('../../utils/gisUtils');

const mapRaceQsToSyrf = async (data, raceMetadata) => {
  if (!raceMetadata) {
    console.log(`mapRaceQsToSyrf requires raceMetadata`);
    return;
  }
  if (!data.RaceQsEvent?.length) {
    console.log(`mapRaceQsToSyrf requires RaceQsEvent`);
    return;
  }
  // event
  const event = data.RaceQsRegatta?.map((e) => {
    return {
      id: e.id,
      original_id: e.original_id.toString(),
      name: e.name,
      url: e.url,
    };
  })[0];

  console.log('Saving to main database');
  const boatIdToOriginalIdMap = {};
  const inputBoats = _mapBoats(data.RaceQsParticipant, boatIdToOriginalIdMap);

  const courseSequencedGeometries = _mapSequencedGeometries(
    data.RaceQsDivision,
    data.RaceQsWaypoint,
  );

  const positions = _mapPositions(data.RaceQsPosition);

  const rankings = _mapRankings(data.RaceQsParticipant);

  const raceQsRace = data.RaceQsEvent[0];
  await saveCompetitionUnit({
    event,
    race: {
      id: raceQsRace.id,
      original_id: raceQsRace.original_id?.toString(),
      url: raceQsRace.url,
      scrapedUrl: raceQsRace.url,
    },
    boats: inputBoats,
    positions,
    raceMetadata,
    courseSequencedGeometries,
    rankings,
    reuse: {
      event: true,
      boats: true,
    },
  });
};

const _mapBoats = (boats, boatIdToOriginalIdMap) => {
  return boats?.map((b) => {
    boatIdToOriginalIdMap[b.original_id] = b.id;
    const vessel = {
      id: b.id,
      publicName: b.boat,
      vesselId: b.original_id.toString(),
      handicap: {},
    };
    return vessel;
  });
};

const _mapPositions = (positions) => {
  if (!positions) {
    return [];
  }
  return positions
    .map((t) => {
      if (!t.time || isNaN(t.time)) {
        return null;
      }
      return {
        ...t,
        // RaceQs does not use ms
        timestamp: +t.time * 100,
        race_id: t.event,
        race_original_id: t.event_original_id.toString(),
        vesselId: t.participant,
        boat_original_id: t.participant_original_id.toString(),
        cog: t.heading,
        windSpeed: t.wind_speed ? Number.parseFloat(t.wind_speed) : null,
        windDirection: t.wind_angle ? Number.parseFloat(t.wind_angle) : null,
      };
    })
    .filter((t) => t)
    .sort((a, b) => a.timestamp - b.timestamp);
};

const _mapSequencedGeometries = (raceQsDivision = [], raceQsWaypoint = []) => {
  const courseSequencedGeometries = [];
  let order = 1;

  raceQsWaypoint.sort((a, b) => {
    let division1Index = raceQsDivision.findIndex((t) => t.name === a.name);
    let division2Index = raceQsDivision.findIndex((t) => t.name === b.name);
    division1Index = division1Index !== -1 ? division1Index : Infinity;
    division2Index = division2Index !== -1 ? division2Index : Infinity;
    return division1Index - division2Index;
  });

  for (const waypoint of raceQsWaypoint) {
    if (waypoint.used) {
      continue;
    }
    if (
      waypoint.type?.toLowerCase() === 'mark' ||
      !waypoint.lat2 ||
      !waypoint.lon2
    ) {
      courseSequencedGeometries.push({
        ...gisUtils.createGeometryPoint({
          lat: waypoint.lat,
          lon: waypoint.lon,
          properties: { name: waypoint.name },
        }),
        order: order,
      });
    } else {
      courseSequencedGeometries.push({
        ...gisUtils.createGeometryLine(
          {
            lat: waypoint.lat,
            lon: waypoint.lon,
          },
          { lat: waypoint.lat2, lon: waypoint.lon2 },
          {
            name: waypoint.name,
            type: waypoint.type?.toLowerCase(),
          },
        ),
        order: order,
      });
      // only apply for line
      _markWaypointsUsed(raceQsWaypoint, waypoint);
    }
    order++;
  }

  return courseSequencedGeometries;
};

const _markWaypointsUsed = (raceQsWaypoint = [], currentWayPoint) => {
  raceQsWaypoint
    .filter(
      (t) =>
        t.lat === currentWayPoint.lat &&
        t.lon === currentWayPoint.lon &&
        t.lat2 === currentWayPoint.lat2 &&
        t.lon2 === currentWayPoint.lon2,
    )
    .map((t) => (t.used = true));
};
const _mapRankings = (boats = []) => {
  const rankings = [];
  for (const boat of boats) {
    const ranking = { vesselId: boat.id, elapsedTime: 0, finishTime: 0 };
    if (boat.finish) {
      ranking.finishTime = new Date(boat.finish).getTime();
    }
    if (boat.start && boat.finish) {
      ranking.elapsedTime = ranking.finishTime - new Date(boat.start).getTime();
    }
    rankings.push(ranking);
  }

  rankings.sort((a, b) => {
    const elapsedTimeA = a.elapsedTime || Infinity;
    const elapsedTimeB = b.elapsedTime || Infinity;
    return elapsedTimeA - elapsedTimeB;
  });

  return rankings;
};
module.exports = mapRaceQsToSyrf;

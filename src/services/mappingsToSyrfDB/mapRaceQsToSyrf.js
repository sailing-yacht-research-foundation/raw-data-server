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

  // for each division we can create a separated race
  console.log('Saving to main database');
  for (const division of data.RaceQsDivision) {
    const inputBoats = _mapBoats(data.RaceQsParticipant);

    const courseSequencedGeometries = _mapSequencedGeometries(
      division,
      data.RaceQsStart,
      data.RaceQsWaypoint,
      data.RaceQsRoute,
    );

    const positions = _mapPositions(data.RaceQsPosition, division);

    const rankings = _mapRankings(data.RaceQsParticipant);

    const raceQsEvent = data.RaceQsEvent[0];
    const raceName = [event.name, raceQsEvent.name, division.name]
      .filter((t) => t)
      .join(' - ');
    await saveCompetitionUnit({
      event,
      race: {
        id: raceQsEvent.id,
        original_id: raceQsEvent.original_id?.toString(),
        url: raceQsEvent.url,
        scrapedUrl: raceQsEvent.url,
      },
      boats: inputBoats,
      positions,
      raceMetadata: { ...raceMetadata, id: division.id, name: raceName },
      courseSequencedGeometries,
      rankings,
      reuse: {
        event: true,
        boats: true,
      },
    });
  }
};
const _mapBoats = (boats) => {
  return boats?.map((b) => {
    const vessel = {
      id: b.id,
      publicName: b.boat,
      vesselId: b.original_id.toString(),
      handicap: {},
    };
    return vessel;
  });
};

const _mapPositions = (positions, division) => {
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
        race_id: division.id,
        race_original_id: division.original_id.toString(),
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

const _mapSequencedGeometries = (
  raceQsDivision,
  raceQsStart = [],
  raceQsWaypoint = [],
  raceQsRoute = [],
) => {
  const start = raceQsStart.find((t) => t.division === raceQsDivision.id);
  // no race qs start then this race does not have any course
  // For example:
  // "Non-Spinnaker", "PHRF 99 or less" in this race, https://raceqs.com/tv-beta/tv.htm#eventId=1730, do not have any courses
  if (!start) {
    return [];
  }
  const courseSequencedGeometries = [];
  // find waypoints that belong to current division
  const availableWayPoints = new Set(
    raceQsRoute.filter((t) => t.start === start.id).map((t) => t.waypoint),
  );

  // only waypoint that in the route can be displayed
  raceQsWaypoint = raceQsWaypoint.filter((t) => availableWayPoints.has(t.id));
  let order = 1;
  for (const waypoint of raceQsWaypoint) {
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
    }
    order++;
  }

  return courseSequencedGeometries;
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

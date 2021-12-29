const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const gisUtils = require('../../utils/gisUtils');
const moment = require('moment');
// 600.000 ms = 10 minutes
const THRESHOLD_TIME = 600000;
const mapRaceQsToSyrf = async (data, raceMetadatas) => {
  if (!raceMetadatas?.length) {
    console.log(`mapRaceQsToSyrf requires raceMetadatas`);
    return;
  }
  if (!data.RaceQsEvent?.length) {
    console.log(`mapRaceQsToSyrf requires RaceQsEvent`);
    return;
  }
  if (!data.RaceQsDivision?.length) {
    console.log(`mapRaceQsToSyrf requires RaceQsDivision`);
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
  const raceQsEvent = data.RaceQsEvent[0];
  for (const [index, division] of data.RaceQsDivision.entries()) {
    const starts =
      data.RaceQsStart?.filter((t) => t.division === division.id) || [];

    // if there is no start so we will take the first division only
    if ((!data.RaceQsStart || !data.RaceQsStart.length) && index > 0) {
      continue;
    }
    // we using do while to ensure in case the division does not have start, then we still be able to save anyway
    do {
      const start = starts.shift();
      const raceMetadata =
        !start && raceMetadatas.length === 1
          ? raceMetadatas[0]
          : raceMetadatas.find((t) => t.id === start.id);
      if (!raceMetadata) {
        console.log(
          `raceMetadata is not found for this start ${start?.id}, from = ${start?.from}`,
        );
        continue;
      }
      const courseSequencedGeometries = _mapSequencedGeometries(
        start,
        data.RaceQsWaypoint,
        data.RaceQsRoute,
      );
      const positions = _mapPositions(data.RaceQsPosition, start);
      const inputBoats = _mapBoats(data.RaceQsParticipant, start);

      // the start with 0 input boat should be ignored.
      if (inputBoats.length === 0) {
        continue;
      }
      const rankings = _mapRankings(inputBoats, start);
      const raceName = _getRaceName(event, division, start, raceQsEvent);

      const raceId = start?.id || division.id;
      const raceOriginalId = start?.original_id || division.original_id;
      await saveCompetitionUnit({
        event,
        race: {
          id: raceId,
          original_id: raceOriginalId?.toString(),
          url: raceQsEvent.url,
          scrapedUrl: raceQsEvent.url,
          name: raceName,
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
        competitionUnitData: { handicap: start?.type },
      });
    } while (starts.length);
  }
};

const _getRaceName = (event, division, start, raceQsEvent) => {
  const raceNames = [event.name, division.name];

  if (start?.from && raceQsEvent.tz) {
    const startTime = moment(start.from).utcOffset(raceQsEvent.tz);
    raceNames.push(startTime.format('HH:mm:ss'));
  }

  return raceNames.filter((t) => t).join(' - ');
};
const _mapBoats = (boats, start) => {
  return boats
    ?.map((b) => {
      const vessel = {
        id: b.id,
        publicName: b.boat,
        vesselId: b.original_id.toString(),
        start: b.start,
        finish: b.finish,
        handicap: {},
      };
      if (start && b.start && b.finish) {
        const boatStartTime = new Date(b.start);
        const boatFinishTime = new Date(b.finish);

        // only the boat within the start will be count
        if (
          boatStartTime.getTime() <= start.from &&
          boatFinishTime >= start.from
        ) {
          return vessel;
        }
        return null;
      }
      return vessel;
    })
    .filter((t) => t);
};

const _mapPositions = (positions, start) => {
  if (!positions) {
    return [];
  }
  return positions
    .map((t) => {
      if (!t.time || isNaN(t.time)) {
        return null;
      }
      const mappedPosition = {
        ...t,
        // RaceQs does not use ms
        timestamp: +t.time * 100,
        vesselId: t.participant,
        boat_original_id: t.participant_original_id.toString(),
        cog: t.heading,
        windSpeed: t.wind_speed ? Number.parseFloat(t.wind_speed) : null,
        windDirection: t.wind_angle ? Number.parseFloat(t.wind_angle) : null,
      };

      // remove the position before start time.
      if (start) {
        if (mappedPosition.timestamp < start.from) {
          return null;
        }
        const lowestTime = start.from - THRESHOLD_TIME;
        if (mappedPosition.timestamp < lowestTime) {
          return null;
        }
      }

      return mappedPosition;
    })
    .filter((t) => t)
    .sort((a, b) => a.timestamp - b.timestamp);
};

const _mapSequencedGeometries = (
  start,
  raceQsWaypoint = [],
  raceQsRoute = [],
) => {
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
  for (const waypoint of raceQsWaypoint) {
    const route = raceQsRoute.find((t) => t.waypoint === waypoint.id);
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
        order: route.sqk,
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
        order: route.sqk,
      });
    }
  }

  return courseSequencedGeometries;
};

const _mapRankings = (boats = [], start) => {
  const rankings = [];
  for (const boat of boats) {
    const ranking = { vesselId: boat.id, elapsedTime: 0, finishTime: 0 };
    if (boat.finish) {
      ranking.finishTime = new Date(boat.finish).getTime();
    }
    if (start) {
      ranking.elapsedTime = ranking.finishTime - start.from;
    } else if (boat.start && boat.finish) {
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

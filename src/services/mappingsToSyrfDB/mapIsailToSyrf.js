const { saveCompetitionUnit } = require('../saveCompetitionUnit');
const {
  createGeometryPoint,
  createGeometryLine,
} = require('../../utils/gisUtils');
const { geometryType, vesselEvents } = require('../../syrf-schema/enums');

const mapAndSave = async (data, raceMetadatas) => {
  console.log('Saving to main database');
  // event
  const event = data.iSailEvent.map((e) => {
    let startTimezone = e.start_timezone_type;
    let stopTimezone = e.stop_timezone_type;

    if (startTimezone?.toString().indexOf('-') < 0 && startTimezone?.toString().indexOf('+') < 0) {
      startTimezone = `+${startTimezone}`;
    }
    const starTimeObj = new Date(e.start_date + startTimezone);

    if (stopTimezone?.toString().indexOf('-') < 0 && stopTimezone?.toString().indexOf('+') < 0) {
      stopTimezone = `+${stopTimezone}`;
    }
    const stopTimeObj = new Date(e.stop_date + stopTimezone);
    return {
      id: e.id,
      original_id: e.original_id,
      name: e.name,
      url: e.url,
      locationName: e.location,
      approxStartTimeMs: starTimeObj.getTime(),
      approxEndTimeMs: stopTimeObj.getTime(),
    }
  })[0];

  for (const raceIndex in data.iSailRace) {
    const race = data.iSailRace[raceIndex];
    const raceMetadata = raceMetadatas.find((m) => m.id === race.id);
    const raceTrackIds = race.track_ids?.map((t) => t.toString());
    // vessels
    const raceTracks = data.iSailTrack.filter((t) => {
      return raceTrackIds?.includes(t.original_id.toString());
    });
    const raceParticipantIds = raceTracks.map(
      (t) => t.original_participant_id.toString()
    );
    const raceParticipants = data.iSailEventParticipant.filter((p) =>
      raceParticipantIds.includes(p.original_id.toString())
    );
    const inputBoats = _mapBoats(
      raceParticipants,
    );

    // positions
    const racePositions = data.iSailPosition.filter((pos) => {
      const isPositionInTrack = raceTrackIds?.includes(
          pos.original_track_id.toString()
      );
      if (isPositionInTrack) {
          let isPositionInRaceTime;
          const isAfterStart =
              pos.time >= race.start * 1000;
          const isBeforeEnd =
              pos.time <= race.stop * 1000;
          if (raceIndex === 0) {
              // include positions before start if race is earliest
              isPositionInRaceTime = isBeforeEnd;
          } else if (raceIndex === data.iSailRace.length - 1) {
              // include positions after end if race is latest
              isPositionInRaceTime = isAfterStart;
          } else {
              isPositionInRaceTime =
                  isAfterStart && isBeforeEnd;
          }
          return isPositionInRaceTime;
      }
      return false;
    });
    if (racePositions.length === 0) {
      console.log('No race positions so skipping.');
      continue;
    }
    const inputPositions = _mapPositions(
      racePositions,
    );

    // courseMarks are only used for ordering
    const raceCourseMarks = data.iSailCourseMark?.filter(
      (s) => s.original_race_id === race.original_id
    );
    const raceMarks = data.iSailMark?.filter(
      (s) => s.original_race_id === race.original_id
    );
    const raceStartLines = data.iSailStartline?.filter(
      (s) => s.original_race_id === race.original_id
    );
    const courseSequencedGeometries = _mapSequencedGeometries(raceCourseMarks, raceMarks, raceStartLines);

    // roundings
    const inputRoundings = _mapRoundings(
      data.iSailRounding?.filter((r) => raceTrackIds?.includes(r.original_track_id?.toString())),
      courseSequencedGeometries,
      raceTracks,
      race.id
    );

    // rankings
    const rankings = _mapRankings(
      data.iSailResult?.filter((r) => r.original_race_id === race.original_id),
      raceMetadata.approx_start_time_ms,
    );

    const inputRace = {
      id: race.id,
      original_id: race.original_id,
      url: race.url,
      scrapedUrl: event.url,
    };
    await saveCompetitionUnit({
      event,
      race: inputRace,
      boats: inputBoats,
      positions: inputPositions,
      raceMetadata,
      courseSequencedGeometries,
      rankings,
      vesselParticipantEvents: inputRoundings,
      reuse: {
        event: true,
      },
    });
  }
};

const _mapBoats = (boats) => {
  return boats?.map((b) => {
    const vessel = {
      id: b.id,
      publicName: b.name,
      globalId: b.sail_no,
      vesselId: b.original_id,
      model: b.class_name,
    };
    return vessel;
  });
};

const _mapPositions = (positions) => {
  return positions?.map((p) => ({
    lon: p.lon,
    lat: p.lat,
    cog: p.heading,
    sog: p.speed,
    vesselId: p.participant,
  }));
};

const _mapSequencedGeometries = (courseMarks, marks = [], startlines = []) => {
  const courseSequencedGeometries = [];
  let order = 0;
  for (const mark of marks) {
    const cm = courseMarks?.find((cm) => cm.mark === mark.id);
    const newPoint = createGeometryPoint({
      lat: mark.lat,
      lon: mark.lon,
      properties: {
        name: mark.name,
        courseMarkId: cm?.original_id,
      },
    });
    newPoint.order = cm?.position || order;
    courseSequencedGeometries.push(newPoint);
    order++;
  }

  for (const startline of startlines) {
    const cm = courseMarks?.find((cm) => cm.startline === startline.id);
    const line = createGeometryLine(
      {
        lat: startline.lat_1,
        lon: startline.lon_1,
      },
      {
        lat: startline.lat_2,
        lon: startline.lon_2,
      },
      {
        name: startline.name,
        courseMarkId: cm?.original_id,
      },
    );
    line.order = cm?.position || order;
    courseSequencedGeometries.push(line);
    order++;
  }

  return courseSequencedGeometries;
};

const _mapRankings = (results, raceStart) => {
  return results?.map((r) => {
      const finishTime = r.time * 1000;
      return {
        vesselId: r.participant,
        finishTime,
        elapsedTime: finishTime - raceStart,
      };
    })
    .sort((a, b) => (a.finishTime || Infinity) - (b.finishTime || Infinity) );
};

const _mapRoundings = (roundings, courseSequencedGeometries, raceTracks, raceId) => {
  return roundings?.map((r) => {
    const eventGeometry = courseSequencedGeometries?.find((g) =>
      g.properties?.courseMarkId?.toString() === r.original_course_mark_id?.toString(),
    )
    const eventType = eventGeometry.geometryType === geometryType.LINESTRING ? vesselEvents.insideCrossing : vesselEvents.rounding;
    const track = raceTracks.find((t) => t.original_id.toString() === r.original_track_id.toString());

    return {
      competitionUnitId: raceId,
      vesselId: track.participant,
      markId: r.course_mark,
      eventType,
      eventTime: r.time * 1000,
    }
  });
};

module.exports = mapAndSave;

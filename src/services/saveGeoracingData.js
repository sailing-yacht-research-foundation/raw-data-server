const { SOURCE } = require('../constants');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { normalizeRace } = require('./normalization/normalizeGeoracing');
const mapAndSave = require('./mappingsToSyrfDB/mapGeoracingToSyrf');
const { triggerWeatherSlicer } = require('./weatherSlicerUtil');
const elasticsearch = require('../utils/elasticsearch');
const {
  generateMetadataName,
  createTurfPoint,
  getCountryAndCity,
} = require('../utils/gisUtils');
const { getTrackerLogoUrl } = require('./s3Util');

const saveGeoracingData = async (data) => {
  let errorMessage = '';
  let raceMetadatas;

  if (process.env.NODE_ENV !== 'test') {
    const finishedRaces = [];
    for (const race of data.GeoracingRace) {
      const now = Date.now();

      const raceStartTime = new Date(race.start_time).getTime();
      const raceEndTime = new Date(race.end_time).getTime();

      const isUnfinished = raceStartTime > now || raceEndTime > now; // also use startTime in case end time is undefined
      if (isUnfinished) {
        console.log(
          `Future race detected for race original id ${race.original_id}`,
        );
        try {
          // The deletion of previous elastic search is on a different endpoint and will be triggered by the tracker-scraper
          await _indexUnfinishedRaceToES(race, data);
        } catch (err) {
          console.log(
            `Failed indexing unfinished race original id ${race.original_id}`,
            err,
          );
        }
      } else {
        finishedRaces.push(race);
      }
    }

    data.GeoracingRace = finishedRaces;
    if (data.GeoracingRace.length > 0) {
      raceMetadatas = await normalizeRace(data);
      try {
        await mapAndSave(data, raceMetadatas);
      } catch (err) {
        console.log(err);
        errorMessage = databaseErrorHandler(err);
      }
    }
  }

  if (raceMetadatas && !errorMessage) {
    for (const raceMetadata of raceMetadatas) {
      await triggerWeatherSlicer(raceMetadata);
    }
  }
  return errorMessage;
};

const _indexUnfinishedRaceToES = async (race, data) => {
  const event = data.GeoracingEvent[0];

  const startDate = race.start_time ? new Date(race.start_time) : null;
  const endTime = race.end_time ? new Date(race.end_time) : null;

  const name = generateMetadataName(
    event.name,
    race?.name.toString(),
    startDate.getTime(),
  );
  const startPoint = _getStartPoint(race, data);

  const body = {
    id: race.id,
    name,
    event_name: event.name,
    source: SOURCE.GEORACING,
    url: race.url,
    start_year: startDate.getUTCFullYear(),
    start_month: startDate.getUTCMonth() + 1,
    start_day: startDate.getUTCDate(),
    approx_start_time_ms: startDate?.getTime(),
    approx_end_time_ms: endTime?.getTime(),
    open_graph_image: getTrackerLogoUrl(SOURCE.GEORACING), // use tracker logo for unfinished races
    is_unfinished: true, // only attribute for unfinished races
    scraped_original_id: race.original_id.toString(), // Used to check if race has been indexed in es. Convert to string for other scraper uses uid instead of int
  };

  if (startPoint) {
    body.approx_start_point = startPoint.geometry;
    const { countryName, cityName } = await getCountryAndCity({
      lon: startPoint.geometry.coordinates[0],
      lat: startPoint.geometry.coordinates[1],
    });

    if (countryName) {
      body.start_country = countryName;
    }
    if (cityName) {
      body.start_city = cityName;
    }
  } else if (event.short_description) {
    body.start_city = event.short_description;
  }

  await elasticsearch.indexRace(race.id, body);
};

function _getStartPoint(race, data) {
  switch (race.player_version) {
    case 2:
      return _getStartPointVersion2(race, data);
    case 3:
      return _getStartPointVersion3(race, data);
  }
  return null;
}

function _getStartPointVersion2(race, data) {
  const activeCourse = data.GeoracingCourse?.find(
    (c) => c.race === race.id && c.active.toString() === '1',
  );
  if (!activeCourse) {
    return null;
  }
  // geometries
  // In georacing, there are multiple courses per race but there can only be 1 active course
  let raceCourseObjects, raceCourseElements;
  const courseElementIdToOrigIdMap = {};

  raceCourseObjects = data.GeoracingCourseObject?.filter(
    (co) => co.race === race.id && co.course === activeCourse.id,
  );
  raceCourseElements = data.GeoracingCourseElement?.filter((ce) => {
    if (ce.race === race.id && ce.course === activeCourse.id) {
      courseElementIdToOrigIdMap[ce.original_id] = ce.id;
      return true;
    } else {
      return false;
    }
  });
  if (!raceCourseObjects || !raceCourseElements) {
    return null;
  }
  const startCourse = raceCourseObjects.find(
    (t) => t.name?.toLowerCase().indexOf('start') !== -1,
  );
  if (!startCourse) {
    return null;
  }
  const startCourseElementPoint = raceCourseElements.find(
    (ce) => ce.course_object === startCourse.id && ce.longitude && ce.latitude,
  );
  if (!startCourseElementPoint) {
    return null;
  }
  return createTurfPoint(
    startCourseElementPoint.latitude,
    startCourseElementPoint.longitude,
  );
}

function _getStartPointVersion3(race, data) {
  const raceLines = data.GeoracingLine?.filter((ce) => ce.race === race.id);
  let startLine = raceLines?.find(
    (lineT) => lineT.name.toLowerCase() === '"départ"',
  );

  if (!startLine) {
    startLine = raceLines?.find(
      (lineT) => lineT.name.toLowerCase() === '"orthodromie"',
    );
  }

  if (!startLine) {
    return null;
  }
  const coords = startLine.points.split('\r\n');
  const first = coords[0];
  if (first.includes(',')) {
    const latf = first.split(',')[1];
    const lonf = first.split(',')[0];
    return createTurfPoint(latf, lonf);
  }
  if (first.includes(';')) {
    const latf = first.split(';')[1];
    const lonf = first.split(';')[0];
    return createTurfPoint(latf, lonf);
  }
  return null;
}

module.exports = saveGeoracingData;

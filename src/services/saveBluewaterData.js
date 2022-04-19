const { SOURCE } = require('../constants');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { normalizeRace } = require('./normalization/normalizeBluewater');
const mapAndSave = require('./mappingsToSyrfDB/mapBluewaterToSyrf');
const { triggerWeatherSlicer } = require('./weatherSlicerUtil');
const { competitionUnitStatus } = require('../syrf-schema/enums');
const elasticsearch = require('../utils/elasticsearch');
const {
  createTurfPoint,
  findCenter,
  getCountryAndCity,
} = require('../utils/gisUtils');
const { getTrackerLogoUrl } = require('./s3Util');

const saveBluewaterData = async (data) => {
  let errorMessage = '';
  let raceMetadata;

  // temporary add of test env to avoid accidentally saving on maindb until its mocked
  if (process.env.NODE_ENV !== 'test') {
    const finishedRaces = [];
    for (const race of data.BluewaterRace) {
      const now = Date.now();
      const raceStartTimeMs = new Date(race.start_time).getTime();
      const raceEndTimeMs = new Date(race.track_time_finish).getTime();
      const isUnfinished =
        raceStartTimeMs > now ||
        (raceStartTimeMs && !race.track_time_finish) ||
        raceEndTimeMs > now;
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
    data.BluewaterRace = finishedRaces;

    if (data.BluewaterRace.length) {
      try {
        raceMetadata = await normalizeRace(data);
        await mapAndSave(data, raceMetadata);
      } catch (err) {
        console.log(err);
        errorMessage = databaseErrorHandler(err);
      }
    }
  }

  if (!errorMessage) {
    await triggerWeatherSlicer(raceMetadata);
  }
  return errorMessage;
};

const _indexUnfinishedRaceToES = async (race, data) => {
  const startDate = new Date(race.start_time);
  const startTime = startDate.getTime();
  const endTime = new Date(race.track_time_finish).getTime();
  const map = data.BluewaterMap?.[0];
  let startPoint;
  if (map?.start_line) {
    try {
      const start = JSON.parse(map.start_line);
      if (start.length === 2) {
        const sideA = start[0];
        const sideB = start[1];
        startPoint = findCenter(sideA[1], sideA[0], sideB[1], sideB[0]);
      } else {
        const course = JSON.parse(map.course);
        if (course.length > 0) {
          const startT = course[0];
          startPoint = createTurfPoint(startT[1], startT[0]);
        }
      }
    } catch (err) {
      console.log(`Invalid start line for url ${race.url}`, map.start_line);
    }
  }

  const body = {
    id: race.id,
    name: race.name,
    source: SOURCE.BLUEWATER,
    url: race.referral_url,
    start_year: startDate.getUTCFullYear(),
    start_month: startDate.getUTCMonth() + 1,
    start_day: startDate.getUTCDate(),
    approx_start_time_ms: startTime,
    open_graph_image: getTrackerLogoUrl(SOURCE.BLUEWATER), // use tracker logo for unfinished races
    is_unfinished: true, // only attribute for unfinished races
    scraped_original_id: race.original_id.toString(), // Used to check if race has been indexed in es. Convert to string for other scraper uses uid instead of int
  };
  if (race.track_time_finish && !isNaN(endTime)) {
    body.approx_end_time_ms = endTime;
  } else {
    if (startTime > Date.now()) {
      body.status = competitionUnitStatus.ONGOING;
    } else {
      body.status = competitionUnitStatus.SCHEDULED;
    }
  }

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
  }

  await elasticsearch.indexRace(race.id, body);
};

module.exports = saveBluewaterData;

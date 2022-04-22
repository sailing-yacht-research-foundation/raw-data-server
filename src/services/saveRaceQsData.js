const { SOURCE } = require('../constants');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { normalizeRace } = require('./normalization/normalizeRaceQs');
const { triggerWeatherSlicer } = require('./weatherSlicerUtil');
const mapRaceQsToSyrf = require('../services/mappingsToSyrfDB/mapRaceQsToSyrf');
const { competitionUnitStatus } = require('../syrf-schema/enums');
const elasticsearch = require('../utils/elasticsearch');
const {
  generateMetadataName,
  createTurfPoint,
  getCountryAndCity,
} = require('../utils/gisUtils');
const { getTrackerLogoUrl } = require('./s3Util');

const saveRaceQsData = async (data) => {
  let errorMessage = '';
  let raceMetadatas, esBodies;
  if (process.env.NODE_ENV !== 'test') {
    const finishedRaces = [];
    for (const race of data.RaceQsEvent) {
      const now = Date.now();
      const startTime = +race.from;
      const endTime = +race.till;
      const isUnfinished =
        startTime > now || (startTime && !endTime) || endTime > now;
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
    data.RaceQsEvent = finishedRaces;

    if (data.RaceQsEvent.length) {
      try {
        ({ raceMetadatas, esBodies } = await normalizeRace(data));
        const savedCompetitionUnits = await mapRaceQsToSyrf(
          data,
          raceMetadatas,
        );
        await elasticsearch.updateEventAndIndexRaces(
          esBodies,
          savedCompetitionUnits,
        );
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
  const regatta = data.RaceQsRegatta[0];
  const waypoints = data.RaceQsWaypoint;
  const startTimeMs = +race.from;
  const endTimeMs = +race.till;
  const startDate = new Date(startTimeMs);
  const name = generateMetadataName(regatta.name, race.name, startTimeMs);
  const startWaypoint =
    waypoints?.find((wp) => wp.type === 'Start') || waypoints?.[0];
  let startPoint;

  if (startWaypoint && startWaypoint.lat && startWaypoint.lon) {
    startPoint = createTurfPoint(startWaypoint.lat, startWaypoint.lon);
  } else if (race.lat1 && race.lon1) {
    startPoint = createTurfPoint(race.lat1, race.lon1);
  }

  const body = {
    id: race.id,
    name,
    event_name: regatta.name,
    source: SOURCE.RACEQS,
    url: race.url,
    start_year: startDate.getUTCFullYear(),
    start_month: startDate.getUTCMonth() + 1,
    start_day: startDate.getUTCDate(),
    approx_start_time_ms: startTimeMs,
    open_graph_image: getTrackerLogoUrl(SOURCE.RACEQS), // use tracker logo for unfinished races
    is_unfinished: true, // only attribute for unfinished races
    scraped_original_id: race.original_id.toString(), // Used to check if race has been indexed in es. Convert to string for other scraper uses uid instead of int
  };

  if (endTimeMs) {
    body.approx_end_time_ms = endTimeMs;
  } else {
    if (startTimeMs > Date.now()) {
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

module.exports = saveRaceQsData;

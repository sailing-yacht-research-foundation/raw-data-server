const { SOURCE } = require('../constants');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { normalizeRace } = require('./normalization/normalizeKwindoo');
const mapAndSave = require('./mappingsToSyrfDB/mapKwindooToSyrf');
const { triggerWeatherSlicer } = require('../utils/weatherSlicerUtil');
const { getUnfinishedRaceStatus } = require('../utils/competitionUnitUtil');
const elasticsearch = require('../utils/elasticsearch');
const {
  generateMetadataName,
  createTurfPoint,
  getCountryAndCity,
} = require('../utils/gisUtils');
const { getTrackerLogoUrl } = require('../utils/s3Util');

const saveKwindooData = async (data) => {
  let errorMessage = '';
  let raceMetadatas, esBodies;

  if (!data?.KwindooRace) {
    return;
  }

  const finishedRaces = [];
  for (const race of data.KwindooRace) {
    const now = Date.now();
    const raceStartTime = race.start_timestamp * 1000;
    const raceEndTime = race.end_timestamp * 1000;
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
  data.KwindooRace = finishedRaces;
  if (data.KwindooRace.length > 0) {
    try {
      ({ raceMetadatas, esBodies } = await normalizeRace(data));
      const savedCompetitionUnits = await mapAndSave(data, raceMetadatas);
      await elasticsearch.updateEventAndIndexRaces(
        esBodies,
        savedCompetitionUnits,
      );
    } catch (err) {
      console.log(err);
      errorMessage = databaseErrorHandler(err);
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
  const regatta = data.KwindooRegatta[0];
  const waypoints = data.KwindooWaypoint?.filter((wp) => wp.race === race.id);
  const homeportLocation = data.KwindooHomeportLocation[0];
  const startTimeMs = race.start_timestamp * 1000;
  const startDate = new Date(startTimeMs);
  const name = generateMetadataName(regatta.name, race.name, startTimeMs);
  const startWaypoint = waypoints?.find((wp) => wp.role === 'start');
  let startPoint;
  if (startWaypoint) {
    startPoint = createTurfPoint(
      startWaypoint.primary_marker_lat,
      startWaypoint.primary_marker_lon,
    );
  } else if (homeportLocation) {
    // If start waypoint does not exist, use homeport as start point
    startPoint = createTurfPoint(homeportLocation.lat, homeportLocation.lon);
  }

  const body = {
    id: race.id,
    name,
    event_name: regatta.name,
    source: SOURCE.KWINDOO,
    url: race.url,
    start_year: startDate.getUTCFullYear(),
    start_month: startDate.getUTCMonth() + 1,
    start_day: startDate.getUTCDate(),
    approx_start_time_ms: startTimeMs,
    approx_end_time_ms: race.end_timestamp * 1000,
    open_graph_image: getTrackerLogoUrl(SOURCE.KWINDOO), // use tracker logo for unfinished races
    is_unfinished: true, // only attribute for unfinished races
    scraped_original_id: race.original_id.toString(), // Used to check if race has been indexed in es. Convert to string for other scraper uses uid instead of int
  };

  body.status = getUnfinishedRaceStatus(startDate);

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

module.exports = saveKwindooData;

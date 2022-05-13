const { SOURCE } = require('../constants');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { normalizeRace } = require('./normalization/normalizeTackTracker');
const { triggerWeatherSlicer } = require('../utils/weatherSlicerUtil');
const { getUnfinishedRaceStatus } = require('../utils/competitionUnitUtil');
const mapTackTrackerToSyrf = require('../services/mappingsToSyrfDB/mapTackTrackerToSyrf');
const elasticsearch = require('../utils/elasticsearch');
const {
  generateMetadataName,
  getCountryAndCity,
  createTurfPoint,
  findCenter,
} = require('../utils/gisUtils');
const { getTrackerLogoUrl } = require('../utils/s3Util');

const saveTackTrackerData = async (data) => {
  let errorMessage = '';
  let raceMetadatas, esBodies;

  if (!data?.TackTrackerRace) {
    return;
  }

  const finishedRaces = [];
  for (const race of data.TackTrackerRace) {
    const now = Date.now();
    const raceStartTime = new Date(Date.parse(race.start)).getTime();
    const isUnfinished = raceStartTime >= now || race.state !== 'Complete';
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
  data.TackTrackerRace = finishedRaces;
  if (data.TackTrackerRace.length > 0) {
    try {
      ({ raceMetadatas, esBodies } = await normalizeRace(data));
      const savedCompetitionUnit = await mapTackTrackerToSyrf(
        data,
        raceMetadatas?.[0],
      );
      await elasticsearch.updateEventAndIndexRaces(esBodies, [
        savedCompetitionUnit,
      ]);
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
  const regatta = data.TackTrackerRegatta?.[0];
  const startLine = data.TackTrackerStart?.find((s) => s.race === race.id);
  const startTimeMs = Date.parse(race.start);
  const startDate = new Date(startTimeMs);
  const name = generateMetadataName(regatta?.name, race.name, startTimeMs);
  let startPoint;
  if (startLine) {
    startPoint = findCenter(
      startLine.start_mark_lat,
      startLine.start_mark_lon,
      startLine.start_pin_lat,
      startLine.start_pin_lon,
    );
  } else {
    let startMark = data.TackTrackerMark?.find((m) =>
      m.name?.toLowerCase().includes('start'),
    );
    if (!startMark) {
      startMark = data.TackTrackerMark?.[0];
    }
    if (startMark) {
      startPoint = createTurfPoint(startMark.lat, startMark.lon);
    }
  }

  const body = {
    id: race.id,
    name,
    source: SOURCE.TACKTRACKER,
    url: race.url,
    start_year: startDate.getUTCFullYear(),
    start_month: startDate.getUTCMonth() + 1,
    start_day: startDate.getUTCDate(),
    approx_start_time_ms: startTimeMs,
    open_graph_image: getTrackerLogoUrl(SOURCE.TACKTRACKER), // use tracker logo for unfinished races
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

module.exports = saveTackTrackerData;

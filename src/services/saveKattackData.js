const { SOURCE } = require('../constants');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { normalizeRace } = require('./normalization/normalizeKattack');
const mapAndSave = require('./mappingsToSyrfDB/mapKattackToSyrf');
const { triggerWeatherSlicer } = require('../utils/weatherSlicerUtil');
const elasticsearch = require('../utils/elasticsearch');
const { getTrackerLogoUrl } = require('../utils/s3Util');
const { createTurfPoint, getCountryAndCity } = require('../utils/gisUtils');

const saveKattackData = async (data) => {
  let errorMessage = '';
  let raceMetadata, esBody;

  if (!data?.KattackRace) {
    return;
  }

  const finishedRaces = [];
  for (const race of data.KattackRace) {
    const now = Date.now();
    const raceStartTime = +race.race_start_time_utc;
    const raceEndTime =
      +race.race_start_time_utc + race.race_length_sec * 1000;

    const isUnfinished = raceStartTime > now || raceEndTime > now;

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
  data.KattackRace = finishedRaces;

  if (data.KattackRace?.length) {
    try {
      ({ raceMetadata, esBody } = await normalizeRace(data));
      const savedCompetitionUnit = await mapAndSave(data, raceMetadata);
      // Exclude buoy races for now bec buoy race positions are relative to an undetermined position and always in Ghana
      if (!(raceMetadata?.url.indexOf('BuoyPlayer.aspx') > -1)) {
        await elasticsearch.updateEventAndIndexRaces(
          [esBody],
          [savedCompetitionUnit],
        );
      }
    } catch (err) {
      console.log(err);
      errorMessage = databaseErrorHandler(err);
    }
  }

  if (!errorMessage) {
    await triggerWeatherSlicer(raceMetadata);
  }
  return errorMessage;
};

const _indexUnfinishedRaceToES = async (race, data) => {
  const startTimeMs = +race.race_start_time_utc;
  const endTimeMs = +race.race_start_time_utc + race.race_length_sec * 1000;
  const startDate = new Date(startTimeMs);
  const startWaypoint = data.KattackWaypoint?.[0];
  let startPoint;
  if (startWaypoint) {
    startPoint = createTurfPoint(+startWaypoint.lat, +startWaypoint.lon);
  }

  const body = {
    id: race.id,
    name: race.name,
    source: SOURCE.KATTACK,
    url: race.url,
    start_year: startDate.getUTCFullYear(),
    start_month: startDate.getUTCMonth() + 1,
    start_day: startDate.getUTCDate(),
    approx_start_time_ms: startTimeMs,
    approx_end_time_ms: endTimeMs,
    open_graph_image: getTrackerLogoUrl(SOURCE.KATTACK), // use tracker logo for unfinished races
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
  }

  await elasticsearch.indexRace(race.id, body);
};

module.exports = saveKattackData;

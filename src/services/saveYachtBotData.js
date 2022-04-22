const { SOURCE } = require('../constants');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { normalizeRace } = require('./normalization/normalizeYachtBot');
const { triggerWeatherSlicer } = require('./weatherSlicerUtil');
const mapYachtbotToSyrf = require('../services/mappingsToSyrfDB/mapYachtbotToSyrf');
const elasticsearch = require('../utils/elasticsearch');
const { createTurfPoint, getCountryAndCity } = require('../utils/gisUtils');
const { getTrackerLogoUrl } = require('./s3Util');

const saveYachtBotData = async (data) => {
  let errorMessage = '';
  let raceMetadata, esBody;

  if (process.env.NODE_ENV !== 'test') {
    const finishedRaces = [];
    for (const race of data.YachtBotRace) {
      const now = Date.now();
      const raceStartTime = +race.start_time;
      const raceEndTime = +race.end_time;
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
    data.YachtBotRace = finishedRaces;

    if (data.YachtBotRace?.length) {
      try {
        ({ raceMetadata, esBody } = await normalizeRace(data));
        const savedCompetitionUnit = await mapYachtbotToSyrf(
          data,
          raceMetadata,
        );
        await elasticsearch.updateEventAndIndexRaces(
          [esBody],
          [savedCompetitionUnit],
        );
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
  const startTimeMs = parseInt(race.start_time);
  const startDate = new Date(startTimeMs);
  const staticMark = data.YachtBotMark?.find((m) => m.lat && m.lon);
  let startPoint;
  if (staticMark) {
    startPoint = createTurfPoint(staticMark.lat, staticMark.lon);
  }

  const body = {
    id: race.id,
    name: race.name,
    source: SOURCE.YACHTBOT,
    url: race.url,
    start_year: startDate.getUTCFullYear(),
    start_month: startDate.getUTCMonth() + 1,
    start_day: startDate.getUTCDate(),
    approx_start_time_ms: startTimeMs,
    approx_end_time_ms: +race.end_time,
    open_graph_image: getTrackerLogoUrl(SOURCE.YACHTBOT), // use tracker logo for unfinished races
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

  console.log(`Index race ${race.id} with body`, body);
  await elasticsearch.indexRace(race.id, body);
};

module.exports = saveYachtBotData;

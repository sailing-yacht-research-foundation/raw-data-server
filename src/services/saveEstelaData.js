const { SOURCE } = require('../constants');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { normalizeRace } = require('./normalization/normalizeEstela');
const mapAndSave = require('./mappingsToSyrfDB/mapEstelaToSyrf');
const { triggerWeatherSlicer } = require('./weatherSlicerUtil');
const elasticsearch = require('../utils/elasticsearch');
const { getTrackerLogoUrl } = require('./s3Util');
const { createTurfPoint, getCountryAndCity } = require('../utils/gisUtils');

const saveEstelaData = async (data) => {
  let errorMessage = '';
  let raceMetadata;

  if (process.env.NODE_ENV !== 'test') {
    try {
      const finishedRaces = [];
      for (const race of data.EstelaRace) {
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
            await _indexUnfinishedRaceToES(race);
          } catch (err) {
            console.log(
              `Failed indexing unfinished race original id ${race.original_id}`,
              err,
            );
            errorMessage = databaseErrorHandler(err);
          }
        } else {
          finishedRaces.push(race);
        }
      }
      data.EstelaRace = finishedRaces;

      if (data.EstelaRace?.length) {
        raceMetadata = await normalizeRace(data);
        await mapAndSave(data, raceMetadata);
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

const _indexUnfinishedRaceToES = async (race) => {
  const startTimeMs = race.start_timestamp * 1000;
  const startDate = new Date(startTimeMs);
  let startPoint;
  if (race.initLat && race.initLon) {
    startPoint = createTurfPoint(race.initLat, race.initLon);
  }

  const body = {
    id: race.id,
    name: race.name,
    source: SOURCE.ESTELA,
    url: race.url,
    start_year: startDate.getUTCFullYear(),
    start_month: startDate.getUTCMonth() + 1,
    start_day: startDate.getUTCDate(),
    approx_start_time_ms: startTimeMs,
    approx_end_time_ms: race.end_timestamp * 1000,
    open_graph_image: getTrackerLogoUrl(SOURCE.ESTELA), // use tracker logo for unfinished races
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

module.exports = saveEstelaData;

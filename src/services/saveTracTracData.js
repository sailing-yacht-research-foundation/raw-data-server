const { SOURCE } = require('../constants');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { normalizeRace } = require('./normalization/normalizeTracTrac');
const { triggerWeatherSlicer } = require('./weatherSlicerUtil');
const mapTracTracToSyrf = require('../services/mappingsToSyrfDB/mapTracTracToSyrf');
const elasticsearch = require('../utils/elasticsearch');
const {
  generateMetadataName,
  createTurfPoint,
  getCountryAndCity,
} = require('../utils/gisUtils');
const { getTrackerLogoUrl } = require('./s3Util');

const saveTracTracData = async (data) => {
  let errorMessage = '';
  let raceMetadatas, esBodies;

  if (process.env.NODE_ENV !== 'test') {
    const finishedRaces = [];
    for (const race of data.TracTracRace) {
      const now = Date.now();
      const raceStartTime = new Date(race.tracking_start).getTime();
      const raceEndTime = new Date(race.tracking_stop).getTime();
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
    data.TracTracRace = finishedRaces;

    if (data.TracTracRace?.length) {
      try {
        ({ raceMetadatas, esBodies } = await normalizeRace(data));
        const savedCompetitionUnit = await mapTracTracToSyrf(
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
  }

  if (raceMetadatas && !errorMessage) {
    for (const raceMetadata of raceMetadatas) {
      await triggerWeatherSlicer(raceMetadata);
    }
  }
  return errorMessage;
};

const _indexUnfinishedRaceToES = async (race, data) => {
  const event = data.TracTracEvent?.[0];
  const startDate = new Date(race.tracking_start);
  const startTimeMs = startDate.getTime();
  const name = generateMetadataName(event?.name, race.name, startTimeMs);
  let startPoint;
  if (event?.lat && event?.lon) {
    // only event races has lat lon on events
    startPoint = createTurfPoint(event?.lat, event?.lon);
  }

  if (!startPoint && race.lat && race.lon) {
    startPoint = createTurfPoint(race.lat, race.lon);
  }

  const body = {
    id: race.id,
    name,
    event_name: event?.name,
    source: SOURCE.TRACTRAC,
    url: race.url,
    start_year: startDate.getUTCFullYear(),
    start_month: startDate.getUTCMonth() + 1,
    start_day: startDate.getUTCDate(),
    approx_start_time_ms: startTimeMs,
    approx_end_time_ms: new Date(race.tracking_stop).getTime(),
    open_graph_image: getTrackerLogoUrl(SOURCE.TRACTRAC), // use tracker logo for unfinished races
    is_unfinished: true, // only attribute for unfinished races
    scraped_original_id: race.original_id.toString(), // Used to check if race has been indexed in es. Convert to string for other scraper uses uid instead of int
  };

  if (startPoint) {
    // there is a country and city in tractrac events/race but it is abbreviated so to make it standard use our own from given positions
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

module.exports = saveTracTracData;

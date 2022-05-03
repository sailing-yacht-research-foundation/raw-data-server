const { SOURCE } = require('../constants');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { triggerWeatherSlicer } = require('../utils/weatherSlicerUtil');
const { normalizeGeovoile } = require('./normalization/normalizeGeovoile');
const mapGeovoileToSyrf = require('./mappingsToSyrfDB/mapGeovoileToSyrf');
const elasticsearch = require('../utils/elasticsearch');
const { getTrackerLogoUrl } = require('../utils/s3Util');
const { createTurfPoint, getCountryAndCity } = require('../utils/gisUtils');

const saveGeovoileData = async (data) => {
  if (!data?.geovoileRace) {
    return;
  }
  let errorMessage = '';
  let raceMetadata, esBody;

  // temporary add of test env to avoid accidentally saving on maindb until its mocked
  try {
    const { geovoileRace } = data;
    const now = Date.now();
    const isUnfinished =
      geovoileRace.startTime * 1000 > now || geovoileRace.endTime * 1000 > now;
    if (isUnfinished) {
      console.log(
        `Future race detected for race scrapedUrl = ${geovoileRace.scrapedUrl}`,
      );
      try {
        // The deletion of previous elastic search is on a different endpoint and will be triggered by the tracker-scraper
        await _indexUnfinishedRaceToES(geovoileRace, data);
      } catch (err) {
        console.log(
          `Failed indexing unfinished race scrapedUrl ${geovoileRace.scrapedUrl}`,
          err,
        );
      }
    } else {
      ({ raceMetadata, esBody } = await normalizeGeovoile(data));
      const savedCompetitionUnit = await mapGeovoileToSyrf(data, raceMetadata);
      await elasticsearch.updateEventAndIndexRaces(
        [esBody],
        [savedCompetitionUnit],
      );
    }
  } catch (err) {
    console.log(err);
    errorMessage = databaseErrorHandler(err);
  }

  if (!errorMessage && raceMetadata) {
    await triggerWeatherSlicer(raceMetadata);
  }

  return errorMessage;
};

const _indexUnfinishedRaceToES = async (race, data) => {
  const startTimeMs = race.startTime * 1000;
  const startDate = new Date(startTimeMs);
  const startMark = data.marks?.find(
    (mark) => mark?.type.toLowerCase()?.indexOf('start') >= 0,
  );
  let startPoint;
  if (startMark) {
    startPoint = createTurfPoint(startMark.lat, startMark.lon);
  } else {
    const startGate = data.courseGates?.find(
      (gate) => gate.properties?.name?.toLowerCase()?.indexOf('start') >= 0,
    );
    if (startGate) {
      const coordinate = startGate.coordinates[0];
      startPoint = createTurfPoint(
        coordinate.position[1],
        coordinate.position[0],
      );
    }
  }

  const body = {
    id: race.id,
    name: race.name,
    source: SOURCE.GEOVOILE,
    url: race.scrapedUrl,
    start_year: startDate.getUTCFullYear(),
    start_month: startDate.getUTCMonth() + 1,
    start_day: startDate.getUTCDate(),
    approx_start_time_ms: startTimeMs,
    approx_end_time_ms: (race.endTime || 0) * 1000,
    open_graph_image: getTrackerLogoUrl(SOURCE.GEOVOILE),
    is_unfinished: true, // only attribute for unfinished races
    scraped_original_id: race.scrapedUrl,
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

module.exports = saveGeovoileData;

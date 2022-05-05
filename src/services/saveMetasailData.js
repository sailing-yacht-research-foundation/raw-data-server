const { SOURCE } = require('../constants');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { normalizeRace } = require('./normalization/normalizeMetasail');
const { triggerWeatherSlicer } = require('../utils/weatherSlicerUtil');
const { getUnfinishedRaceStatus } = require('../utils/competitionUnitUtil');
const mapMetasailToSyrf = require('./mappingsToSyrfDB/mapMetasailToSyrf');
const elasticsearch = require('../utils/elasticsearch');
const {
  generateMetadataName,
  createTurfPoint,
  getCountryAndCity,
} = require('../utils/gisUtils');
const { getTrackerLogoUrl } = require('../utils/s3Util');

const saveMetasailData = async (data) => {
  let errorMessage = '';
  let raceMetadatas, esBodies;

  if (process.env.NODE_ENV !== 'test') {
    const finishedRaces = [];
    for (const race of data.MetasailRace) {
      const now = Date.now();
      const raceStartTime = +race.start;
      const raceEndTime = +race.stop;
      const isUnfinished =
        raceStartTime > now ||
        raceEndTime > now ||
        raceEndTime < 0 ||
        typeof race.stop === 'undefined';

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
    data.MetasailRace = finishedRaces;

    if (data.MetasailRace?.length) {
      try {
        ({ raceMetadatas, esBodies } = await normalizeRace(data));
        const savedCompetitionUnits = await mapMetasailToSyrf(
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
  const event = data.MetasailEvent?.[0];
  const startTimeMs = +race.start;
  const startDate = new Date(startTimeMs);
  const name = generateMetadataName(event?.name, race.name, startTimeMs);
  const buoy = data.MetasailBuoy[0];
  let startPoint;
  if (buoy?.lat && buoy?.lon) {
    startPoint = createTurfPoint(buoy.lat, buoy.lon);
  }

  const body = {
    id: race.id,
    name,
    event_name: event?.name,
    source: SOURCE.METASAIL,
    url: race.url,
    start_year: startDate.getUTCFullYear(),
    start_month: startDate.getUTCMonth() + 1,
    start_day: startDate.getUTCDate(),
    approx_start_time_ms: startTimeMs,
    open_graph_image: getTrackerLogoUrl(SOURCE.METASAIL), // use tracker logo for unfinished races
    is_unfinished: true, // only attribute for unfinished races
    scraped_original_id: race.original_id.toString(), // Used to check if race has been indexed in es. Convert to string for other scraper uses uid instead of int
  };
  if (+race.stop > 0) {
    body.approx_end_time_ms = +race.stop;
  }

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

module.exports = saveMetasailData;

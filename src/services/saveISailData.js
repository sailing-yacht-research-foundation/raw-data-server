const { SOURCE } = require('../constants');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { normalizeRace } = require('./normalization/normalizeISail');
const mapAndSave = require('./mappingsToSyrfDB/mapIsailToSyrf');
const { triggerWeatherSlicer } = require('../utils/weatherSlicerUtil');
const { getUnfinishedRaceStatus } = require('../utils/competitionUnitUtil');
const elasticsearch = require('../utils/elasticsearch');
const {
  generateMetadataName,
  findCenter,
  getCountryAndCity,
} = require('../utils/gisUtils');
const { getTrackerLogoUrl } = require('../utils/s3Util');

const saveISailData = async (data) => {
  let errorMessage = '';
  let raceMetadatas, esBodies;

  if (!data?.iSailRace) {
    return;
  }

  const finishedRaces = [];
  for (const race of data.iSailRace) {
    const now = Date.now();
    const startTime = race.start * 1000;
    const endTime = race.stop * 1000;
    const isUnfinished = startTime > now || endTime > now;
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
  data.iSailRace = finishedRaces;

  if (data.iSailRace.length) {
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
  const event = data.iSailEvent[0];
  const startTime = race.start * 1000;
  const endTime = race.stop * 1000;
  const startDate = new Date(startTime);
  const name = generateMetadataName(event.name, race.name, startTime);
  const eventStartLines = data.iSailStartline;
  const raceStartLines = eventStartLines?.filter(
    (s) => s.original_race_id === race.original_id,
  );
  const startLine =
    raceStartLines?.find((sl) => sl.name === 'start') || raceStartLines?.[0];
  let startPoint;
  if (startLine) {
    startPoint = findCenter(
      startLine.lat_1,
      startLine.lon_1,
      startLine.lat_2,
      startLine.lon_2,
    );
  }

  const body = {
    id: race.id,
    name,
    event_name: event.name,
    source: SOURCE.ISAIL,
    url: race.url,
    start_year: startDate.getUTCFullYear(),
    start_month: startDate.getUTCMonth() + 1,
    start_day: startDate.getUTCDate(),
    approx_start_time_ms: startTime,
    approx_end_time_ms: endTime,
    open_graph_image: getTrackerLogoUrl(SOURCE.ISAIL), // use tracker logo for unfinished races
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

module.exports = saveISailData;

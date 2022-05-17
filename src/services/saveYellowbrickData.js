const { SOURCE } = require('../constants');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { normalizeRace } = require('./normalization/normalizeYellowbrick');
const { triggerWeatherSlicer } = require('../utils/weatherSlicerUtil');
const { getUnfinishedRaceStatus } = require('../utils/competitionUnitUtil');
const mapYellowBrickToSyrf = require('../services/mappingsToSyrfDB/mapYellowBrickToSyrf');
const elasticsearch = require('../utils/elasticsearch');
const { getTrackerLogoUrl } = require('../utils/s3Util');
const { createTurfPoint, getCountryAndCity } = require('../utils/gisUtils');

const saveYellowbrickData = async (data) => {
  let errorMessage = '';
  let raceMetadata, esBody;

  if (!data?.YellowbrickRace) {
    return;
  }

  try {
    const finishedRaces = [];
    for (const race of data.YellowbrickRace) {
      const now = Date.now();
      const raceStartTime = race.start * 1000;
      const raceEndTime = race.stop * 1000;
      const isUnfinished = raceStartTime > now || raceEndTime > now; // also use startTime in case end time is undefined
      if (isUnfinished) {
        console.log(
          `Future race detected for race original id ${race.race_code}`,
        );
        try {
          // The deletion of previous elastic search is on a different endpoint and will be triggered by the tracker-scraper
          await _indexUnfinishedRaceToES(race, data);
        } catch (err) {
          console.log(
            `Failed indexing unfinished race original id ${race.race_code}`,
            err,
          );
        }
      } else {
        finishedRaces.push(race);
      }
    }
    data.YellowbrickRace = finishedRaces;

    if (data.YellowbrickRace.length) {
      ({ raceMetadata, esBody } = await normalizeRace(data));
      const savedCompetitionUnit = await mapYellowBrickToSyrf(
        data,
        raceMetadata,
      );
      await elasticsearch.updateEventAndIndexRaces(
        [esBody],
        [savedCompetitionUnit],
      );
    }
  } catch (err) {
    console.log(err);
    errorMessage = databaseErrorHandler(err);
  }

  if (!errorMessage) {
    await triggerWeatherSlicer(raceMetadata);
  }

  return errorMessage;
};

const _indexUnfinishedRaceToES = async (race, data) => {
  const startTimeMs = race.start * 1000;
  const startDate = new Date(startTimeMs);
  const startCourseNode = data.YellowbrickCourseNode?.find(
    (n) => n.order?.toString() === '1',
  );
  let startPoint;
  if (startCourseNode) {
    startPoint = createTurfPoint(startCourseNode.lat, startCourseNode.lon);
  } else if (data.YellowbrickPoi?.[0].nodes) {
    // if there are no course nodes, use first poi as start point
    const poiNodes = data.YellowbrickPoi?.[0].nodes.split(',');
    if (!isNaN(poiNodes?.[0]) && !isNaN(poiNodes?.[1])) {
      startPoint = createTurfPoint(poiNodes[0], poiNodes[1]);
    }
  }

  const body = {
    id: race.id,
    name: race.title,
    source: SOURCE.YELLOWBRICK,
    url: race.url,
    start_year: startDate.getUTCFullYear(),
    start_month: startDate.getUTCMonth() + 1,
    start_day: startDate.getUTCDate(),
    approx_start_time_ms: startTimeMs,
    approx_end_time_ms: race.stop * 1000,
    open_graph_image: getTrackerLogoUrl(SOURCE.YELLOWBRICK), // use tracker logo for unfinished races
    is_unfinished: true, // only attribute for unfinished races
    scraped_original_id: race.race_code.toString(), // Used to check if race has been indexed in es. Convert to string for other scraper uses uid instead of int
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

module.exports = saveYellowbrickData;

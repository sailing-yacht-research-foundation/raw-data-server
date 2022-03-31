const { v4: uuidv4 } = require('uuid');

const { SAVE_DB_POSITION_CHUNK_COUNT, SOURCE } = require('../constants');
const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { normalizeRace } = require('./normalization/normalizeMetasail');
const { triggerWeatherSlicer } = require('./weatherSlicerUtil');
const mapMetasailToSyrf = require('./mappingsToSyrfDB/mapMetasailToSyrf');
const { competitionUnitStatus } = require('../syrf-schema/enums');
const elasticsearch = require('../utils/elasticsearch');
const {
  generateMetadataName,
  createTurfPoint,
  getCountryAndCity,
} = require('../utils/gisUtils');
const { getTrackerLogoUrl } = require('./s3Util');

const saveMetasailData = async (data) => {
  let errorMessage = '';
  let metasailPositions;
  let raceMetadatas;
  if (process.env.ENABLE_MAIN_DB_SAVE_METASAIL !== 'true') {
    let eventUrl = [];
    const transaction = await db.sequelize.transaction();
    try {
      if (data.MetasailEvent) {
        eventUrl = data.MetasailEvent.map((row) => {
          return { url: row.url, original_id: row.original_id };
        });
        await db.metasailEvent.bulkCreate(data.MetasailEvent, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.MetasailRace) {
        await db.metasailRace.bulkCreate(data.MetasailRace, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.MetasailBoat) {
        await db.metasailBoat.bulkCreate(data.MetasailBoat, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.MetasailBuoy) {
        await db.metasailBuoy.bulkCreate(data.MetasailBuoy, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.MetasailGate) {
        await db.metasailGate.bulkCreate(data.MetasailGate, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.MetasailPosition) {
        metasailPositions = data.MetasailPosition.slice();
        while (metasailPositions.length > 0) {
          const splicedArray = metasailPositions.splice(
            0,
            SAVE_DB_POSITION_CHUNK_COUNT,
          );
          await db.metasailPosition.bulkCreate(splicedArray, {
            ignoreDuplicates: true,
            validate: true,
            transaction,
          });
        }
      }

      if (data.MetasailRace) {
        raceMetadatas = await normalizeRace(data, transaction);
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      errorMessage = databaseErrorHandler(error);
    }

    if (eventUrl.length > 0) {
      if (errorMessage) {
        await db.metasailFailedUrl.bulkCreate(
          eventUrl.map((row) => {
            return {
              id: uuidv4(),
              url: row.url,
              error: errorMessage,
            };
          }),
          {
            ignoreDuplicates: true,
            validate: true,
          },
        );
      } else {
        await db.metasailSuccessfulUrl.bulkCreate(
          eventUrl.map((row) => {
            return {
              id: uuidv4(),
              url: row.url,
              original_id: row.original_id,
            };
          }),
          {
            ignoreDuplicates: true,
            validate: true,
          },
        );
      }
    }
  }

  if (
    process.env.ENABLE_MAIN_DB_SAVE_METASAIL === 'true' &&
    process.env.NODE_ENV !== 'test'
  ) {
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
        raceMetadatas = await normalizeRace(data);
        await mapMetasailToSyrf(data, raceMetadatas);
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
  } else {
    if (startTimeMs > Date.now()) {
      body.status = competitionUnitStatus.ONGOING;
    } else {
      body.status = competitionUnitStatus.SCHEDULED;
    }
  }

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

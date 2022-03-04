const { v4: uuidv4 } = require('uuid');

const { SAVE_DB_POSITION_CHUNK_COUNT, SOURCE } = require('../constants');
const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const { normalizeRace } = require('./normalization/normalizeKattack');
const mapAndSave = require('./mappingsToSyrfDB/mapKattackToSyrf');
const { triggerWeatherSlicer } = require('./weatherSlicerUtil');
const elasticsearch = require('../utils/elasticsearch');
const { getTrackerLogoUrl } = require('./s3Util');
const { createTurfPoint, getCountryAndCity } = require('../utils/gisUtils');

const saveKattackData = async (data) => {
  let errorMessage = '';
  let raceMetadata;

  if (process.env.ENABLE_MAIN_DB_SAVE_KATTACK !== 'true') {
    let raceUrl = [];
    const transaction = await db.sequelize.transaction();
    try {
      if (data.KattackRace) {
        raceUrl = data.KattackRace.map((row) => {
          return { url: row.url, original_id: row.original_id };
        });
        await db.kattackRace.bulkCreate(data.KattackRace, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.KattackYachtClub) {
        await db.kattackYachtClub.bulkCreate(data.KattackYachtClub, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.KattackDevice) {
        await db.kattackDevice.bulkCreate(data.KattackDevice, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.KattackPosition) {
        const positions = data.KattackPosition.slice(); // clone array to avoid mutating the data
        while (positions.length > 0) {
          const splicedArray = positions.splice(
            0,
            SAVE_DB_POSITION_CHUNK_COUNT,
          );
          await db.kattackPosition.bulkCreate(splicedArray, {
            ignoreDuplicates: true,
            validate: true,
            transaction,
          });
        }
      }
      if (data.KattackWaypoint) {
        await db.kattackWaypoint.bulkCreate(data.KattackWaypoint, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.KattackRace) {
        raceMetadata = await normalizeRace(data, transaction);
      }
      await transaction.commit();
    } catch (error) {
      console.log(error);
      await transaction.rollback();
      errorMessage = databaseErrorHandler(error);
    }

    if (raceUrl.length > 0) {
      if (errorMessage) {
        await db.kattackFailedUrl.bulkCreate(
          raceUrl.map((row) => {
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
        await db.kattackSuccessfulUrl.bulkCreate(
          raceUrl.map((row) => {
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
    process.env.ENABLE_MAIN_DB_SAVE_KATTACK === 'true' &&
    process.env.NODE_ENV !== 'test'
  ) {
    const finishedRaces = [];
    for (const race of data.KattackRace) {
      const now = Date.now();
      const raceStartTime = +race.race_start_time_utc;
      const raceEndTime =
        +race.race_start_time_utc + race.feed_length_sec * 1000;
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
        raceMetadata = await normalizeRace(data);
        await mapAndSave(data, raceMetadata);
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
  const startTimeMs = +race.race_start_time_utc;
  const endTimeMs = +race.race_start_time_utc + race.feed_length_sec * 1000;
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

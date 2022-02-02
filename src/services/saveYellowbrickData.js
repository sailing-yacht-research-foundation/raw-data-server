const { v4: uuidv4 } = require('uuid');

const { SAVE_DB_POSITION_CHUNK_COUNT, SOURCE } = require('../constants');
const db = require('../models');
const databaseErrorHandler = require('../utils/databaseErrorHandler');
const uploadUtil = require('./uploadUtil');
const { normalizeRace } = require('./normalization/normalizeYellowbrick');
const { triggerWeatherSlicer } = require('./weatherSlicerUtil');
const KML_S3_BUCKET = process.env.AWS_YELLOWBRICK_KML_S3_BUCKET;
const mapYellowBrickToSyrf = require('../services/mappingsToSyrfDB/mapYellowBrickToSyrf');
const elasticsearch = require('../utils/elasticsearch');
const { getTrackerLogoUrl } = require('./s3Util');
const { createTurfPoint, getCountryAndCity } = require('../utils/gisUtils');

const saveYellowbrickData = async (data) => {
  const transaction = await db.sequelize.transaction();
  let errorMessage = '';
  let raceUrl = [];
  let raceMetadata;
  if (process.env.ENABLE_MAIN_DB_SAVE_YELLOWBRICK !== 'true') {
    try {
      if (data.YellowbrickRace) {
        raceUrl = data.YellowbrickRace.map((row) => {
          return { url: row.url, original_id: row.race_code };
        });
        await db.yellowbrickRace.bulkCreate(data.YellowbrickRace, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.YellowbrickCourseNode) {
        await db.yellowbrickCourseNode.bulkCreate(data.YellowbrickCourseNode, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.YellowbrickLeaderboardTeam) {
        await db.yellowbrickLeaderboardTeam.bulkCreate(
          data.YellowbrickLeaderboardTeam,
          {
            ignoreDuplicates: true,
            validate: true,
            transaction,
          },
        );
      }
      if (data.YellowbrickPoi) {
        await db.yellowbrickPoi.bulkCreate(data.YellowbrickPoi, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.YellowbrickPosition) {
        const positions = data.YellowbrickPosition.slice(); // clone array to avoid mutating the data
        while (positions.length > 0) {
          const splicedArray = positions.splice(
            0,
            SAVE_DB_POSITION_CHUNK_COUNT,
          );
          await db.yellowbrickPosition.bulkCreate(splicedArray, {
            ignoreDuplicates: true,
            validate: true,
            transaction,
          });
        }
      }
      if (data.YellowbrickTag) {
        await db.yellowbrickTag.bulkCreate(data.YellowbrickTag, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.YellowbrickTeam) {
        await db.yellowbrickTeam.bulkCreate(data.YellowbrickTeam, {
          ignoreDuplicates: true,
          validate: true,
          transaction,
        });
      }
      if (data.YellowbrickKml) {
        for (const kmlObj of data.YellowbrickKml) {
          await uploadUtil.uploadDataToS3({
            Bucket: KML_S3_BUCKET,
            Key: `${kmlObj.id}.kml`,
            Body: kmlObj.data,
          });
        }
      }
      if (data.YellowbrickRace) {
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
        await db.yellowbrickFailedUrl.bulkCreate(
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
        await db.yellowbrickSuccessfulUrl.bulkCreate(
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
    process.env.ENABLE_MAIN_DB_SAVE_YELLOWBRICK === 'true' &&
    process.env.NODE_ENV !== 'test'
  ) {
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
        raceMetadata = await normalizeRace(data);
        await mapYellowBrickToSyrf(data, raceMetadata);
      }
    } catch (err) {
      console.log(err);
    }
  }

  if (raceMetadata) {
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

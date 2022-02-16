require('dotenv').config();
const { SOURCE } = require('../../src/constants');
const s3Util = require('../../src/services/s3Util');
const elasticsearch = require('../../src/utils/elasticsearch');

const db = require('../../src/models/index');
const Op = db.Sequelize.Op;

(async () => {
  let geovoileRaces;
  console.log(`**********Start clean up old record for Geovoile **********`);
  do {
    geovoileRaces = await db.geovoileRace.findAll({
      where: {},
      limit: 20,
      raw: true,
    });
    for (const geovoileRace of geovoileRaces) {
      await _deleteGeovoileRace(geovoileRace);
    }
  } while (geovoileRaces?.length);
  await _cleanUpFailedUrl();
  console.log(`**********Finished clean up old record for Geovoile **********`);
})();

async function _deleteGeovoileRace(geovoileRace) {
  let transaction;

  try {
    transaction = await db.sequelize.transaction();

    console.log(
      `Start clean up the data for geovoileRace.id =  ${geovoileRace.id}`,
    );
    await _deleteOpenGraphImage(geovoileRace.id);
    await _cleanUpElasticSearch(geovoileRace.id);
    await _deleteTrackGeojson(geovoileRace.id);
    let param = {
      where: {
        race_id: {
          [Op.eq]: geovoileRace.id,
        },
      },
      transaction,
    };
    await Promise.all([
      db.geovoileRace.destroy({
        where: {
          id: {
            [Op.eq]: geovoileRace.id,
          },
        },
        transaction,
      }),
      db.geovoileBoat.destroy(param),
      db.geovoileBoatPosition.destroy(param),
      db.geovoileBoatSailor.destroy(param),
      db.geovoileMark.destroy(param),
      db.GeovoileGeometry.destroy(param),
      db.GeovoileGeometryGate.destroy(param),
      db.readyAboutRaceMetadata.destroy({
        where: {
          id: {
            [Op.eq]: geovoileRace.id,
          },
          source: {
            [Op.eq]: SOURCE.GEOVOILE,
          },
        },
        transaction,
      }),
      db.readyAboutTrackGeoJsonLookup.destroy({
        where: {
          id: {
            [Op.eq]: geovoileRace.id,
          },
          source: {
            [Op.eq]: SOURCE.GEOVOILE,
          },
        },
        transaction,
      }),
      db.geovoileSuccessfulUrl.destroy({
        where: {
          original_id: {
            [Op.eq]: geovoileRace.original_id,
          },
        },
        transaction,
      }),
    ]);
    await transaction.commit();

    console.log(
      `Finish clean up the data for geovoileRace.id =  ${geovoileRace.id}`,
    );
  } catch (ex) {
    if (transaction) {
      await transaction.rollback();
    }
    console.log(
      `exception happened during clean up the data for geovoileRace.id = ${geovoileRace.id}`,
    );
    console.log(ex);
  }
}
async function _deleteTrackGeojson(raceId) {
  console.log('start _deleteTrackGeojson');
  const readyAboutRaceS3LookUp = await db.readyAboutTrackGeoJsonLookup.findOne({
    where: {
      id: {
        [Op.eq]: raceId,
      },
      source: {
        [Op.eq]: SOURCE.GEOVOILE,
      },
    },
    raw: true,
  });
  if (!readyAboutRaceS3LookUp) {
    return;
  }
  const bucket = process.env.AWS_GEOJSON_S3_BUCKET;
  try {
    console.log(
      `Start delete track geojson with file path = ${readyAboutRaceS3LookUp.s3_id}.geojson`,
    );
    await s3Util.deleteObject(
      bucket,
      readyAboutRaceS3LookUp.s3_id + '.geojson',
    );
    console.log(`Finished delete track geojson  `);
  } catch (ex) {
    console.log(
      `Exception happened during _deleteTrackGeojson for raceId = ${raceId}`,
    );
    console.log(ex);
    throw ex;
  }
}
async function _deleteOpenGraphImage(raceId) {
  const bucket = process.env.OPEN_GRAPH_BUCKET_NAME;
  const folder = `public/competition/${raceId}`;
  try {
    console.log(`Start cleaning up open graph image, folder = ${folder} `);
    await s3Util.deleteDirectory(bucket, folder);
    console.log(`Finished cleaning up open graph image, folder = ${folder} `);
  } catch (ex) {
    console.log(
      `Exception happened during _deleteOpenGraphImage for raceId = ${raceId}`,
    );
    console.log(ex);
    throw ex;
  }
}

async function _cleanUpElasticSearch(raceId) {
  console.log(`Start clean up elastic search = ${raceId}`);
  await elasticsearch.deleteByIds([raceId]);
  console.log(`Finished clean up elastic search = ${raceId}`);
}

async function _cleanUpFailedUrl() {
  let transaction;
  try {
    transaction = await db.sequelize.transaction();

    console.log(`Start clean up all failed url of geovoile`);
    await db.geovoileFailedUrl.destroy({
      where: {},
      truncate: true,
      transaction: transaction,
    }),
      console.log(`Finish clean up all failed url of geovoile`);
  } catch (ex) {
    if (transaction) {
      await transaction.rollback();
    }
    console.log(`exception happened during clean up the data for failed Url`);
    console.log(ex);
  }
}

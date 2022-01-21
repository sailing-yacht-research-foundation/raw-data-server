require('dotenv').config();
const db = require('../src/models');
const syrfDb = require('../src/syrf-schema')
const elasticsearch = require('../src/utils/elasticsearch');
const Op = db.Sequelize.Op;
const fs = require('fs');
const logFileName = 'ESCleanup.json';
const logFailureFileName = 'ESCleanupFailure.json';
const logDeleted = (documents = []) => {
  if (documents.length <= 0) return;
  console.log('logging ', documents.length, 'deleted documents');

  const result = documents.map((t) => JSON.stringify(t)).join(',') + ',';
  fs.appendFileSync(logFileName, result);
};

const logFailures = (documents = []) => {
  if (documents.length <= 0) return;
  console.log('logging ', documents.length, 'failure document deletions');

  const result = documents.map((t) => JSON.stringify(t)).join(',') + ',';
  fs.appendFileSync(logFailureFileName, result);
};

(async () => {
  let shouldFetch = true;
  let lastSort = '0';
  console.log('starting cleanup');

  fs.appendFileSync(logFileName, '[');
  fs.appendFileSync(logFailureFileName, '[');
  do {
    const hits = (await elasticsearch.pageByIdFinishedNotSyrf(lastSort)).data?.hits?.hits;

    if (!Array.isArray(hits)) {
      break;
    }

    console.log(hits.length, ' rows fetched, last sort : ', lastSort);
    if (hits.length <= 0) {
      shouldFetch = false;
    }

    // Check if id is in scraper DB
    const result = (
      await db.readyAboutRaceMetadata.findAll({
        where: {
          id: {
            [Op.in]: hits.map((t) => t._id),
          },
        },
        attributes: ['id'],
        raw: true,
      })
    ).map((t) => t.id);

    let toDelete = hits.filter((t) => !result.includes(t._id));

    // Check if id is in syrf main DB
    const syrfResult = (
      await syrfDb.CompetitionUnit.findAll({
        where: {
          id: {
            [Op.in]: hits.map((t) => t._id),
          },
        },
        attributes: ['id'],
        raw: true,
      })
    ).map((t) => t.id);

    toDelete = hits.filter((t) => !syrfResult.includes(t._id));

    count += toDelete.length;

    logDeleted(toDelete);
    const { deleted, failures } = (
      await elasticsearch.deleteByIds(toDelete.map((t) => t._id))
    ).data;

    logFailures(failures);

    console.log(deleted, 'documents deleted');

    lastSort = hits[hits.length - 1]?.sort?.[0];
  } while (shouldFetch);

  fs.appendFileSync(logFailureFileName, ']');
  fs.appendFileSync(logFileName, ']');

  console.log('Deleted log can be found here ', logFileName);
  console.log('Failed deletion log can be found here ', logFailureFileName);
})();

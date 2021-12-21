require('dotenv').config();
const db = require('../src/models');
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
  let lastSort = 'fffb959b-a12c-4d77-b7bc-8a859f35aaf8';

  let deletedCount = 0;

  console.log('starting cleanup');

  let count = 0;
  fs.appendFileSync(logFileName, '[');
  fs.appendFileSync(logFailureFileName, '[');
  do {
    const hits = (await elasticsearch.pageById(lastSort)).data?.hits?.hits;

    if (!Array.isArray(hits)) {
      break;
    }

    console.log(hits.length, ' rows fetched, last sort : ', lastSort);
    if (hits.length <= 0) {
      shouldFetch = false;
    }

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

    const toDelete = hits.filter((t) => !result.includes(t._id));
    count += toDelete.length;

    logDeleted(toDelete);
    const { deleted, failures } = (
      await elasticsearch.deleteByIds(toDelete.map((t) => t._id))
    ).data;

    logFailures(failures);

    console.log(deleted, 'documents deleted');
    deletedCount += parseInt(deleted);

    lastSort = hits[hits.length - 1]?.sort?.[0];
  } while (shouldFetch);

  fs.appendFileSync(logFailureFileName, ']');
  fs.appendFileSync(logFileName, ']');

  console.log('Deleted log can be found here ', logFileName);
  console.log('Failed deletion log can be found here ', logFailureFileName);
})();

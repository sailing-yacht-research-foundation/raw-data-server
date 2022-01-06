const {
  deleteOrphanedRacesBySource,
  getUnfinishedRaceIdsBySource,
} = require('../utils/elasticsearch');

// This is in case tracker website deletes an unfinished race before its finished
const cleanUnfinishedRaces = async (source, excludedOrigIds) => {
  console.log(
    `Cleaning unfinished races from ${source} excluding`,
    excludedOrigIds,
  );
  await deleteOrphanedRacesBySource(source, excludedOrigIds);
};

// This is to reuse the uid by the scraper so when race is finished it will have same uid
const getUnfinishedRaceIds = async (source) => {
  return (
    (await getUnfinishedRaceIdsBySource(source))?.reduce((prev, row) => {
      prev[row._source.scraped_original_id] = row._source.id;
      return prev;
    }, {}) || {}
  );
};

module.exports = {
  cleanUnfinishedRaces,
  getUnfinishedRaceIds,
};

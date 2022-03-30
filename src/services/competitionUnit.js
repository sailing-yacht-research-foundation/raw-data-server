const {
  deleteOrphanedRacesBySource,
  getUnfinishedRacesBySource,
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
const getUnfinishedRaces = async (source) => {
  return (
    (await getUnfinishedRacesBySource(source))?.reduce((prev, row) => {
      prev[row._source.scraped_original_id] = {
        id: row._source.id,
        approx_end_time_ms: row._source.approx_end_time_ms,
        forceScrape: row._source.forceScrape,
      };
      return prev;
    }, {}) || {}
  );
};

module.exports = {
  cleanUnfinishedRaces,
  getUnfinishedRaces,
};

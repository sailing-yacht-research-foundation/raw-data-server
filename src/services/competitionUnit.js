const { deleteUnfinishedRacesBySource } = require('../utils/elasticsearch');

const deleteUnfinishedRaces = async (source) => {
  await deleteUnfinishedRacesBySource(source);
};

module.exports = {
  deleteUnfinishedRaces,
};

const elasticSearchAPI = require('./elasticSearchAPI');
const { searchIndex } = require('../../syrf-schema/enums');

exports.competitionUnitPush = async (id, data) => {
  const result = await elasticSearchAPI.pushDoc.exec(
    `/${searchIndex.CALENDAR_EVENTS}/_doc/${id}`,
    data,
  );

  return result.data;
};

exports.competitionUnitDelete = async (id) => {
  const result = await elasticSearchAPI.deleteDoc.exec(
    `/${searchIndex.CALENDAR_EVENTS}/_doc/${id}`,
  );

  return result.data;
};

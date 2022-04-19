const { v4: uuidv4 } = require('uuid');
const db = require('../models');
const { TRACKER_MAP } = require('../constants');
const syrfSuccessfulUrlDAL = require('../syrf-schema/dataAccess/v1/scrapedSuccessfulUrl');
const syrfFailedUrlDAL = require('../syrf-schema/dataAccess/v1/scrapedFailedUrl');

const getExistingData = async (source, status = 'both') => {
  let urlList = [];

  if (!source) {
    return urlList;
  }

  if (status === 'success' || status === 'both') {
    urlList.push(...(await _getSuccessData(source)));
  }

  if (status === 'failed' || status === 'both') {
    urlList.push(...(await _getFailedData(source)));
  }

  return urlList;
};

const registerFailure = async (source, url, error) => {
  if (!source || !url || !error) {
    return;
  }
  await syrfFailedUrlDAL.create({
    url: url,
    error,
    source: source.toUpperCase(),
    createdAt: Date.now(),
  });
};

const _getSuccessData = async (source) => {
  const successData = (await syrfSuccessfulUrlDAL.getAll(source.toUpperCase())).map(
    (s) => ({
      ...s,
      original_id: s.originalId,
    }),
  );
  return (
    successData?.map((row) => ({
      url: row.url,
      original_id: row.original_id,
      status: 'success',
    })) || []
  );
};

const _getFailedData = async (source) => {
  const failedData = await syrfFailedUrlDAL.getAll(source.toUpperCase());
  return (
    failedData?.map((row) => {
      return { url: row.url, status: 'failed' };
    }) || []
  );
};

module.exports = {
  getExistingData,
  registerFailure,
};

const { v4: uuidv4 } = require('uuid');
const db = require('../models');
const { TRACKER_MAP } = require('../constants');
const syrfSuccessfulUrlDAL = require('../syrf-schema/dataAccess/v1/scrapedSuccessfulUrl');
const syrfFailedUrlDAL = require('../syrf-schema/dataAccess/v1/scrapedFailedUrl');
const elasticsearch = require('../utils/elasticsearch');

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

  if (process.env[`ENABLE_MAIN_DB_SAVE_${source.toUpperCase()}`] === 'true') {
    await syrfFailedUrlDAL.create({
      url: url,
      error,
      source: source.toUpperCase(),
      createdAt: Date.now(),
    });
  } else {
    let failedModel = db[`${TRACKER_MAP[source.toLowerCase()]}FailedUrl`];
    await failedModel?.create({
      id: uuidv4(),
      url,
      error,
    });
  }

  // Try to delete future race record in elastic search since it threw an error
  try {
    await elasticsearch.deleteByUrl(url);
  } catch (err) {
    if (err.status !== 404 && err.response?.status !== 404) { // suppress error if not exist
      throw err;
    }
  }
};

const _getSuccessData = async (source) => {
  let successData;
  if (process.env[`ENABLE_MAIN_DB_SAVE_${source.toUpperCase()}`] === 'true') {
    successData = (await syrfSuccessfulUrlDAL.getAll(source.toUpperCase())).map(
      (s) => ({
        ...s,
        original_id: s.originalId,
      }),
    );
  } else {
    const successModel =
      db[`${TRACKER_MAP[source.toLowerCase()]}SuccessfulUrl`];
    successData = await successModel?.findAll({
      attributes: ['url', 'original_id'],
      raw: true,
    });
  }
  return (
    successData?.map((row) => ({
      url: row.url,
      original_id: row.original_id,
      status: 'success',
    })) || []
  );
};

const _getFailedData = async (source) => {
  let failedData;
  if (process.env[`ENABLE_MAIN_DB_SAVE_${source.toUpperCase()}`] === 'true') {
    failedData = await syrfFailedUrlDAL.getAll(source.toUpperCase());
  } else {
    const failedModel = db[`${TRACKER_MAP[source.toLowerCase()]}FailedUrl`];
    failedData = await failedModel?.findAll({
      attributes: ['url', 'error'],
      raw: true,
    });
  }
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

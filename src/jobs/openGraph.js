/**
 * @typedef {import('bull').Job} Job
 * @typedef {import('bull').Queue} Queue
 * @typedef {import('bull').JobOptions} JobOptions
 */
const Queue = require('bull');
const bullScripts = require('bull/lib/scripts');
const { bullQueues } = require('../syrf-schema/enums');
/**
 * @type {Queue}
 */
let openGraphQueue;

exports.setup = (opts) => {
  if (!process.env.REDIS_HOST) {
    return;
  }
  openGraphQueue = new Queue(bullQueues.openGraph, opts);
};

/**
 * @param {*} data
 * @param {JobOptions} opts
 * @returns
 */
exports.addEvent = async (data, opts = {}) => {
  if (openGraphQueue) {
    if (opts.jobId) await bullScripts.remove(openGraphQueue, opts.jobId);
    await openGraphQueue.add(
      { ...data, type: 'event' },
      {
        removeOnFail: true,
        removeOnComplete: true,
        ...opts,
      },
    );
  }
};

/**
 * @param {*} data
 * @param {JobOptions} opts
 * @returns
 */
exports.addCompetitionUnit = async (data, opts = {}) => {
  if (openGraphQueue) {
    if (opts.jobId) await bullScripts.remove(openGraphQueue, opts.jobId);
    await openGraphQueue.add(
      { ...data, type: 'competition-unit' },
      {
        removeOnFail: true,
        removeOnComplete: true,
        ...opts,
      },
    );
  }
};

exports.removeJob = async (jobId) => {
  if (openGraphQueue) {
    await bullScripts.remove(openGraphQueue, jobId);
  }
};

const axios = require('axios').default;
const Breaker = require('@syrf/circuit-breaker');

const basicAuth = Buffer.from(
  `${process.env.ELASTIC_SEARCH_USERNAME}:${process.env.ELASTIC_SEARCH_PASSWORD}`,
).toString('base64');

let api = axios.create({
  baseURL: process.env.ELASTIC_SEARCH_HOST,
  headers: {
    Authorization: 'Basic ' + basicAuth,
  },
});

let query = Breaker.create(async (urlPath = '', query) => {
  return await api.post(urlPath, query);
})
  .withExecutionTimeout(parseInt(process.env.EXTERNAL_SERVICE_TIMEOUT || 5000))
  .withBucket({ bucketCount: 3, bucketSpan: 1000 })
  .withFailureThreshold(0.9)
  .withSuccessThreshold(0.3);

let push = Breaker.create(async (path = '', data) => {
  return await api.put(path, data);
})
  .withExecutionTimeout(parseInt(process.env.EXTERNAL_SERVICE_TIMEOUT || 5000))
  .withBucket({ bucketCount: 3, bucketSpan: 1000 })
  .withFailureThreshold(0.9)
  .withSuccessThreshold(0.3);

let deleteDoc = Breaker.create(async (urlPath = '') => {
  return await api.delete(urlPath);
})
  .withExecutionTimeout(parseInt(process.env.EXTERNAL_SERVICE_TIMEOUT || 5000))
  .withBucket({ bucketCount: 3, bucketSpan: 1000 })
  .withFailureThreshold(0.9)
  .withSuccessThreshold(0.3);

exports.query = query;
exports.pushDoc = push;
exports.deleteDoc = deleteDoc;

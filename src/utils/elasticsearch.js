const axios = require('axios');

const basicAuth = Buffer.from(
  `${process.env.AWS_ES_USERNAME}:${process.env.AWS_ES_PASSWORD}`,
).toString('base64');

let api;
if (process.env.AWS_ES_HOST) {
  api = axios.create({
    baseURL: process.env.AWS_ES_HOST,
    headers: {
      Authorization: 'Basic ' + basicAuth,
    },
  });
}

exports.indexRace = async (id, body) => {
  if (api) {
    return await api.put(`races/race/${id}`, body);
  } else {
    return Promise.resolve();
  }
};

exports.updateRace = async (id, body) => {
  if (api) {
    return await api.post(`races/_doc/${id}/_update`, {
      doc: { ...body },
    });
  } else {
    return Promise.resolve();
  }
};

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

exports.pageById = async (searchAfter = '0', size = 200) => {
  if (api) {
    return await api.post(`races/_search`, {
      size,
      query: {
        bool: {
          must_not: {
            match: {
              source: 'SYRF',
            },
          },
        },
      },
      sort: [
        {
          _id: {
            order: 'asc',
          },
        },
      ],
      track_total_hits: false,
      _source: {
        includes: [
          'name',
          'source',
          'event',
          'url',
          'start_country',
          'start_city',
          'start_year',
          'start_month',
          'start_day',
        ],
      },
      search_after: [searchAfter],
    });
  } else {
    return null;
  }
};

exports.deleteByIds = async (ids = []) => {
  if (api) {
    return await api.post(`races/_delete_by_query`, {
      query: {
        terms: {
          _id: ids,
        },
      },
    });
  } else {
    return null;
  }
};

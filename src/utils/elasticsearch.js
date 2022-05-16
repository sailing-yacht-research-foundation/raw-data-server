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
    return await api.put(`races/_doc/${id}`, body);
  } else {
    return Promise.resolve();
  }
};

exports.updateEventAndIndexRaces = async (
  esBodies = [],
  competitionUnits = [],
) => {
  for (const esBody of esBodies) {
    const updatedCU = competitionUnits?.find((cu) => cu.id === esBody.id);
    if (updatedCU) {
      if (updatedCU.calendarEventId) {
        esBody.event = updatedCU.calendarEventId;
      }
      await exports.indexRace(esBody.id, esBody);
    }
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

exports.pageByIdFinishedNotSyrf = async (searchAfter = '0', size = 200) => {
  if (api) {
    return await api.post(`races/_search`, {
      size,
      query: {
        bool: {
          must_not: [
            {
              match: {
                source: 'SYRF',
              },
            },
            {
              match: {
                is_unfinished: true,
              },
            },
          ],
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

exports.deleteOrphanedRacesBySource = async (source, excludedOrigIds) => {
  if (api && source && excludedOrigIds) {
    return await api.post(`races/_delete_by_query`, {
      query: {
        bool: {
          must: [
            {
              term: {
                'source.keyword': source.toUpperCase(),
              },
            },
            {
              term: {
                is_unfinished: true,
              },
            },
          ],
          must_not: [
            {
              terms: {
                'scraped_original_id.keyword': excludedOrigIds,
              },
            },
          ],
        },
      },
    });
  } else {
    return null;
  }
};

exports.getUnfinishedRacesBySource = async (source) => {
  if (api && source) {
    const allHits = [];
    let totalHitCount = 0;
    const size = 50;
    const reqBody = {
      _source: [
        'id',
        'scraped_original_id',
        'approx_end_time_ms',
        'forceScrape',
      ],
      from: 0,
      size,
      sort: ['_score', { approx_start_time_ms: 'DESC' }],
      query: {
        bool: {
          must: [
            {
              term: {
                'source.keyword': source.toUpperCase(),
              },
            },
            {
              term: {
                is_unfinished: true,
              },
            },
          ],
        },
      },
    };
    do {
      const esResult = await api.post(`races/_search`, reqBody);
      const esHits = esResult.data.hits.hits;
      totalHitCount = esResult.data.hits.total.value;
      allHits.push(...esHits);
      reqBody.from += size;
    } while (allHits.length < totalHitCount);

    return allHits;
  } else {
    return null;
  }
};

exports.getRaceWithDanglingEventsBySource = async (source, dbEventIds = []) => {
  if (api && source) {
    const reqBody = {
      _source: ['id'],
      from: 0,
      size: 10000,
      query: {
        bool: {
          must: [
            {
              term: {
                'source.keyword': source.toUpperCase(),
              },
            },
            {
              exists: {
                field: 'event',
              },
            },
          ],
          must_not: [
            {
              exists: {
                field: 'is_unfinished',
              },
            },
            {
              terms: {
                'event.keyword': dbEventIds,
              },
            },
          ],
        },
      },
    };
    const esResult = await api.post(`races/_search`, reqBody);

    return esResult.data.hits.hits;
  } else {
    return [];
  }
};

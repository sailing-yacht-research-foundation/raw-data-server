const elasticsearch = require('elasticsearch');

const elasticsearchclient = new elasticsearch.Client({
  hosts: [process.env.ES_HOST],
});

exports.elasticsearchclient = elasticsearchclient;

exports.indexRace = (id, raceData) =>
  new Promise((resolve, reject) => {
    elasticsearchclient.index(
      {
        index: 'races',
        id: id,
        type: 'race',
        body: raceData,
      },
      function (err, resp) {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      },
    );
  });

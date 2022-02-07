require('dotenv').config();
const db = require('../../src/models');
const elasticsearch = require('../../src/utils/elasticsearch');
const Op = db.Sequelize.Op;
const { SOURCE } = require('../../src/constants');
(async () => {
  console.log('Start updateMetasailUrls script');
  const existingRaces = await db.metasailRace.findAll({
    attributes: ['id', 'url'],
    raw: true,
  });

  console.log(
    `update existingRaces, there are ${existingRaces.length} races in the database`,
  );
  let count = 1;
  for (const race of existingRaces) {
    console.log(
      `processing race ${race.url}, ${count}/${existingRaces.length}`,
    );
    let transaction;
    try {
      const url = race.url.replace('http://', 'https://');
      // only update http race
      transaction = await db.sequelize.transaction();
      await db.metasailRace.update(
        {
          url,
        },
        {
          where: {
            id: race.id,
          },
          transaction,
        },
      );
      await _updateElasticSearch(race, url);
      await transaction.commit();
    } catch (error) {
      console.log('Error while updating existing race');
      console.log(race);
      console.log(error.toString());
      if (transaction) {
        await transaction.rollback();
      }
    }
    count++;
  }

  const existingMetaDatas = await db.readyAboutRaceMetadata.findAll({
    attributes: ['id', 'url'],
    raw: true,
    where: {
      source: {
        [Op.eq]: SOURCE.METASAIL,
      },
      url: {
        [Op.notILike]: 'https%',
      },
    },
  });

  console.log(
    `update existingMetaDatas, there are ${existingMetaDatas.length} metadatas in the database`,
  );
  count = 1;
  for (const data of existingMetaDatas) {
    const transaction = await db.sequelize.transaction();
    console.log(
      `process ${count}/${existingMetaDatas.length} metadata, url = ${data.url}`,
    );
    try {
      const url = data.url.replace('http', 'https');
      await db.readyAboutRaceMetadata.update(
        {
          url,
        },
        {
          where: {
            id: data.id,
          },
          transaction,
        },
      );
      await transaction.commit();
    } catch (error) {
      console.log('Error while updating existing metadata');
      console.log(data);
      console.log(error.toString());
      await transaction.rollback();
    }
  }

  console.log('Finish updateMetasailUrls script');
})();

async function _updateElasticSearch(race, url) {
  try {
    await elasticsearch.updateRace(race.id, {
      url,
    });
  } catch (e) {
    const { response } = e;
    if (response?.status === 404) {
      console.log(`Document not found for race.id = ${race.id}`);
      return;
    }
    console.log(
      `Error while updating elastic search data for race.id= ${race.id}`,
    );
    console.log(race);
    throw e;
  }
}

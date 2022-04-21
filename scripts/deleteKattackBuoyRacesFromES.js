require('dotenv').config();
const syrfDb = require('../src/syrf-schema');
const Op = syrfDb.Sequelize.Op;
const elasticsearch = require('../src/utils/elasticsearch');

(async () => {
  const kattackBuoyRaces = await syrfDb.CompetitionUnit.findAll({
    where: {
      scrapedUrl: {
        [Op.like]: '%BuoyPlayer.aspx%',
      },
    },
    attributes: ['id'],
    raw: true,
    order: [['createdAt', 'DESC']],
  });
  console.log(`Got ${kattackBuoyRaces.length} races. Deleting races`);
  let successCount = 0,
    failedRaces = [];
  while (kattackBuoyRaces.length) {
    try {
      const raceIds = kattackBuoyRaces.splice(0, 1000).map((r) => r.id);
      console.log(`Deleting ${raceIds.length} races`);
      const deleteResult = await elasticsearch.deleteByIds(raceIds);
      successCount += deleteResult.data?.deleted;
      failedRaces = failedRaces.concat(deleteResult.data?.failures);
      console.log(
        `Deleted ${deleteResult.data?.deleted} races with failures`,
        deleteResult.data?.failures,
      );
    } catch (err) {
      console.log('Failed deleteting races', err);
    }
  }
  console.log(
    `Successfully deleted ${successCount} races. Failed deleting ${failedRaces.length} races`,
    failedRaces,
  );
})();

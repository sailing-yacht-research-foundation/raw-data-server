const {
  normalizeRace,
} = require('./src/services/normalization/normalizeYachtBot');

const jsonData = require('./src/test-files/yachtbot.json');

(async () => {
  await normalizeRace(jsonData);
  console.log('done');
})();

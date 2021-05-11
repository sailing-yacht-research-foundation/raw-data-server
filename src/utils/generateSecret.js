var crypto = require('crypto');

var generateSecret = function (plainText) {
  return crypto.createHash('md5').update(plainText).digest('hex');
};

module.exports = generateSecret;

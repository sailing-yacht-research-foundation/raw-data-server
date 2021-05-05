var crypto = require('crypto');

const { AuthNotSetError, AuthInvalidError } = require('../errors');
const { formatDateAuth } = require('../utils/dateFormatter');

var validateSecret = function (req, res, next) {
  let secret = req.get('Authorization');
  if (!secret) {
    throw new AuthNotSetError('No Authorization Header');
  }
  let secretCheck = crypto
    .createHash('md5')
    .update(formatDateAuth())
    .digest('hex');
  if (secretCheck !== secret) {
    throw new AuthInvalidError('No Match');
  }
  next();
};

module.exports = validateSecret;

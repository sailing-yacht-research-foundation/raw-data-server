const { AuthNotSetError, AuthInvalidError } = require('../errors');
const { formatDateAuth } = require('../utils/dateFormatter');
const generateSecret = require('../utils/generateSecret');

var validateSecret = function (req, res, next) {
  let secret = req.headers['authorization'] || req.headers['Authorization'];
  if (!secret) {
    throw new AuthNotSetError('No Authorization Header');
  }
  let secretCheck = generateSecret(formatDateAuth());
  if (secretCheck !== secret) {
    throw new AuthInvalidError('No Match');
  }
  next();
};

module.exports = validateSecret;

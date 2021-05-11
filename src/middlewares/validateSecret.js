const { BadRequestError, AuthInvalidError } = require('../errors');
const generateDateAuthFormat = require('../utils/generateDateAuthFormat');
const generateSecret = require('../utils/generateSecret');

var validateSecret = function (req, res, next) {
  let secret = req.headers['authorization'] || req.headers['Authorization'];
  if (!secret) {
    throw new BadRequestError('No Authorization Header');
  }
  let secretCheck = generateSecret(generateDateAuthFormat());
  if (secretCheck !== secret) {
    throw new AuthInvalidError('No Match');
  }
  next();
};

module.exports = validateSecret;

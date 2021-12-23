const { BadRequestError } = require('../errors');
const { SOURCE } = require('../constants');

const validateTrackerSource = function (req, res, next) {
  const tracker = req.params.tracker || req.body.tracker;
  if (!SOURCE[tracker?.toUpperCase()]) {
    next(new BadRequestError('Invalid tracker source'));
  } else {
    next();
  }
};

module.exports = validateTrackerSource;

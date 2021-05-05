class AuthNotSetError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class AuthInvalidError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// eslint-disable-next-line no-unused-vars
var errorHandler = function (err, req, res, next) {
  let { message } = err;
  if (err instanceof AuthNotSetError) {
    res.status(400).json({ message });
  } else if (err instanceof AuthInvalidError) {
    res.status(403).json({ message: 'Forbidden Access' });
  } else {
    console.log(message);
    res.status(500).send('Server Error');
  }
};

module.exports = {
  AuthNotSetError,
  AuthInvalidError,
  errorHandler,
};

function databaseErrorHandler(error) {
  if (error.errors && Array.isArray(error.errors)) {
    return error.errors.map((err) => err.message).join(', ');
  }
  if (error.message) {
    return error.message;
  }
  return 'Database Error';
}

module.exports = databaseErrorHandler;

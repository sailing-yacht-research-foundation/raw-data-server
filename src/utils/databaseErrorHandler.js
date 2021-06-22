function databaseErrorHandler(error) {
  if (error.message) {
    return error.message;
  }
  if (error.errors && Array.isArray(error.errors)) {
    return error.errors.map((err) => err.message).join(',');
  }
  return 'Database Error';
}

module.exports = databaseErrorHandler;

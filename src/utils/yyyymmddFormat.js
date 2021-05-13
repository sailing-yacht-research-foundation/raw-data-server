const yyyymmddFormat = function (inputDate) {
  let currentDate = inputDate ? new Date(inputDate) : new Date();
  return `${currentDate.getUTCFullYear()}${String(
    currentDate.getUTCMonth() + 1,
  )}${currentDate.getUTCDate()}`;
};

module.exports = yyyymmddFormat;

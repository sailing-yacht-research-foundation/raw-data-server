const crypto = require('crypto');

exports.generateDateAuthFormat = (inputDate) => {
  const currentDate = inputDate ? new Date(inputDate) : new Date();

  return `${currentDate.getUTCFullYear()} ${currentDate.toLocaleString(
    'en-US',
    {
      month: 'short',
      timeZone: 'UTC',
    },
  )} ${currentDate.getUTCDate()}, ${currentDate.toLocaleString('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  })}`;
};

exports.generateSecret = (plainText) => {
  const secretSalt = process.env.SIMPLE_AUTH_SALT;
  return crypto.createHash('md5').update(`${secretSalt}:${plainText}:${secretSalt}`).digest('hex');
};

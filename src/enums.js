const raceSetupType = {
  START: 'START',
  STOP: 'STOP',
  COMPETITION_UNIT_SYNC: 'COMPETITION_UNIT_SYNC',
};
// eslint-disable-next-line no-unused-vars
const errorCodes = {
  INTERNAL_SERVER_ERROR: 'E000', //internal server error
  TOKEN_EXPIRED: 'E001', //expired token
  INVALID_ACCESS_TOKEN: 'E002', //invalid access token
  INVALID_SESSION_TOKEN: 'E003', //invalid session token
  SESSION_NOT_FOUND: 'E004', //invalid session token
  DATA_NOT_FOUND: 'E005', //data not found
  UNAUTHORIZED_DATA_CHANGE: 'E006', //unauthorized data change
  DATA_VALIDATION_FAILED: 'E007', //data validation failed (ex: missing field, data already exists etc )
  INVALID_DEV_TOKEN: 'E007', // authenticate with invalid dev token
  UNAUTHORIZED_DEV_TOKEN: 'E008', // authenticate with invalid dev token
  USER_ALREADY_REGISTERED: 'E009', // register anonymous user failed because user already has a oauth profile
  OAUTH_PROFILE_ALREADY_REGISTERED: 'E010', // register anonymous user failed because oauth profile already registered to other profile
  REGISTERED_USER_ONLY: 'E011', // rejected access to user management, only registered user allowed to access user management
  INVALID_GRANT: 'E012', // invalid grant for password login
  INVALID_REFRESH_TOKEN: 'E013', //invalid refresh token
};

module.exports = {
  errorCodes,
  raceSetupType,
};

const TEMPORARY_FOLDER = 'tmp';

const TRACKER_MAP = {
  bluewater: 'bluewater',
  estela: 'estela',
  georacing: 'georacing',
  isail: 'iSail',
  kattack: 'kattack',
  kwindoo: 'kwindoo',
  metasail: 'metasail',
  raceqs: 'raceQs',
  tacktracker: 'tackTracker',
  tractrac: 'tractrac',
  yachtbot: 'yachtBot',
  yellowbrick: 'yellowbrick',
  swiftsure: 'swiftsure',
  geovoile: 'geovoile',
};

const SOURCE = {
  BLUEWATER: 'BLUEWATER',
  ESTELA: 'ESTELA',
  GEORACING: 'GEORACING',
  GEOVOILE: 'GEOVOILE',
  ISAIL: 'ISAIL',
  KATTACK: 'KATTACK',
  KWINDOO: 'KWINDOO',
  METASAIL: 'METASAIL',
  RACEQS: 'RACEQS',
  TACKTRACKER: 'TACKTRACKER',
  TRACTRAC: 'TRACTRAC',
  YACHTBOT: 'YACHTBOT',
  YELLOWBRICK: 'YELLOWBRICK',
  // 1-offs / non-automatable
  AMERICASCUP: 'AMERICASCUP',
  AMERICASCUP2021: 'AMERICASCUP2021',
  OLDGEOVOILE: 'OLDGEOVOILE',
  REGADATA: 'REGADATA',
  SAP: 'SAP',
  SWIFTSURE: 'SWIFTSURE',
};

const SAVE_DB_POSITION_CHUNK_COUNT = 10000;
const SAVE_DB_CSV_CHUNK_COUNT = 50;

const INTERACTION_TRACK_LENGTH = 30;
const SIMPLIFICATION_TOLERANCE = 0.00001;
const FEET_TO_METERS = 0.3048;

/**
 * START_PREFIX and DIVISION_PREFIX are used in mapRaceQsToSyrf
 * They indicate that the source of race id, whether it is from start or division.
 */
const RACEQS = {
  START_PREFIX: 'raceqs-start-',
  DIVISION_PREFIX: 'raceqs-division-',
};

module.exports = {
  TEMPORARY_FOLDER,
  TRACKER_MAP,
  SAVE_DB_POSITION_CHUNK_COUNT,
  SAVE_DB_CSV_CHUNK_COUNT,
  INTERACTION_TRACK_LENGTH,
  SIMPLIFICATION_TOLERANCE,
  SOURCE,
  FEET_TO_METERS,
  RACEQS,
};

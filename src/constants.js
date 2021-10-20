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

const AMERICAS_CUP_TABLE_SUFFIX = [
  'AvgWind',
  'Boat',
  'BoatShape',
  'CompoundMark',
  'CourseLimit',
  'Event',
  'Mark',
  'Race',
  'Regatta',
  'Position',
];

const SAVE_DB_POSITION_CHUNK_COUNT = 10000;
const SAVE_DB_CSV_CHUNK_COUNT = 50;

const INTERACTION_TRACK_LENGTH = 30;
const SIMPLIFICATION_TOLERANCE = 0.00001;

module.exports = {
  TEMPORARY_FOLDER,
  TRACKER_MAP,
  AMERICAS_CUP_TABLE_SUFFIX,
  SAVE_DB_POSITION_CHUNK_COUNT,
  SAVE_DB_CSV_CHUNK_COUNT,
  INTERACTION_TRACK_LENGTH,
  SIMPLIFICATION_TOLERANCE,
};

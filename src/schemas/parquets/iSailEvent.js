var parquet = require('parquetjs-lite');

module.exports = new parquet.ParquetSchema({
  id: { type: 'UTF8' },
  original_id: { type: 'INT32' },
  name: { type: 'UTF8' },
  start_date: { type: 'TIMESTAMP_MILLIS' },
  start_timezone_type: { type: 'INT32' },
  start_timezone: { type: 'UTF8' },
  stop_date: { type: 'TIMESTAMP_MILLIS' },
  stop_timezone_type: { type: 'INT32' },
  stop_timezone: { type: 'UTF8' },
  club: { type: 'UTF8' },
  location: { type: 'UTF8' },
  url: { type: 'UTF8' },
});

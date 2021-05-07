const parquet = require('parquetjs-lite');
const { TEMPORARY_FOLDER } = require('../constants');
const { iSailEvent } = require('../schemas/parquets/iSail');

const iSailEventToParquet = async (events) => {
  const iSailEventWriter = await parquet.ParquetWriter.openFile(
    iSailEvent,
    `${TEMPORARY_FOLDER}/iSailEvent.parquet`,
  );

  for (let i = 0; i < events.length; i++) {
    const {
      id,
      original_id,
      name,
      start_date,
      start_timezone_type,
      start_timezone,
      stop_date,
      stop_timezone_type,
      stop_timezone,
      club,
      location,
      url,
    } = events[i];

    await iSailEventWriter.appendRow({
      id,
      original_id,
      name,
      start_date: new Date(start_date),
      start_timezone_type,
      start_timezone,
      stop_date: new Date(stop_date),
      stop_timezone_type,
      stop_timezone,
      club,
      location,
      url,
    });
  }
  iSailEventWriter.close();
};

module.exports = {
  iSailEventToParquet,
};

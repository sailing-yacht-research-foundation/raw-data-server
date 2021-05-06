const parquet = require('parquetjs-lite');
const iSailEventSchema = require('../schemas/parquets/iSailEvent');

const iSailEventToParquet = async (iSailData) => {
  const iSailEventWriter = await parquet.ParquetWriter.openFile(
    iSailEventSchema,
    'tmp/iSailEvent.parquet',
  );

  for (let i = 0; i < iSailData.length; i++) {
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
    } = iSailData[i];

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

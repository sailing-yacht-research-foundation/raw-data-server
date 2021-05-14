const parquet = require('parquetjs-lite');

const { iSailCombined } = require('../schemas/parquets/iSail');

const iSailToParquet = async (data, filePath) => {
  const writer = await parquet.ParquetWriter.openFile(iSailCombined, filePath, {
    useDataPageV2: false,
  });

  for (let i = 0; i < data.length; i++) {
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
      participants,
      races,
      trackData,
      tracks,
      positions,
    } = data[i];
    await writer.appendRow({
      event_id: id,
      original_event_id: original_id,
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
      participants: JSON.stringify(participants),
      races: JSON.stringify(races),
      trackData: trackData
        ? {
            id: trackData.id,
            min_lon: trackData.min_lon,
            max_lon: trackData.max_lon,
            min_lat: trackData.min_lat,
            max_lat: trackData.max_lat,
            start_time: trackData.start_time,
            stop_time: trackData.stop_time,
          }
        : null,
      tracks: JSON.stringify(tracks),
      positions: JSON.stringify(positions),
    });
  }
  writer.close();
};

module.exports = iSailToParquet;

const parquet = require('parquetjs-lite');

const {
  iSailEvent,
  iSailRace,
  iSailCombined,
} = require('../schemas/parquets/iSail');

const iSailEventToParquet = async (events, filePath) => {
  const iSailEventWriter = await parquet.ParquetWriter.openFile(
    iSailEvent,
    filePath,
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

const iSailRaceToParquet = async (data, filePath) => {
  const writer = await parquet.ParquetWriter.openFile(iSailRace, filePath);

  for (let i = 0; i < data.length; i++) {
    const {
      id,
      original_id,
      event,
      original_event_id,
      name,
      start,
      stop,
      wind_direction,
      url,
    } = data[i];

    await writer.appendRow({
      id,
      original_id,
      event,
      original_event_id,
      name,
      start: Number(start),
      stop: Number(stop),
      wind_direction,
      url,
    });
  }
  writer.close();
};

const iSailCombinedToParquet = async (data, filePath) => {
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

module.exports = {
  iSailEventToParquet,
  iSailRaceToParquet,
  iSailCombinedToParquet,
};

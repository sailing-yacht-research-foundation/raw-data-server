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
  const writer = await parquet.ParquetWriter.openFile(iSailCombined, filePath);

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
      participants: {
        list: participants.map((row) => {
          const {
            id,
            original_id,
            class: participantClass,
            original_class_id,
            class_name,
            sail_no,
            name,
          } = row;
          return {
            element: {
              id,
              original_id,
              class: participantClass,
              original_class_id,
              class_name,
              sail_no,
              name,
            },
          };
        }),
      },
      races: {
        list: races.map((row) => {
          const { id, original_id, name, start, stop, wind_direction, url } =
            row;
          return {
            element: {
              id,
              original_id,
              name,
              start,
              stop,
              wind_direction,
              url,
            },
          };
        }),
      },
    });
  }
  writer.close();
};

module.exports = {
  iSailEventToParquet,
  iSailRaceToParquet,
  iSailCombinedToParquet,
};

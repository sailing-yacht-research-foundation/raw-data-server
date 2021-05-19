const parquet = require('parquetjs-lite');

const { georacingCombined } = require('../schemas/parquets/georacing');

const georacingToParquet = async (data, filePath) => {
  const writer = await parquet.ParquetWriter.openFile(
    georacingCombined,
    filePath,
    {
      useDataPageV2: false,
    },
  );

  for (let i = 0; i < data.length; i++) {
    const {
      id,
      original_id,
      name,
      short_name,
      time_zone,
      description_en,
      description_fr,
      short_description,
      start_time,
      end_time,
      races,
      actors,
    } = data[i];
    await writer.appendRow({
      id,
      original_id,
      name,
      short_name,
      time_zone,
      description_en,
      description_fr,
      short_description,
      start_time,
      end_time,
      races: JSON.stringify(races),
      actors: JSON.stringify(actors),
    });
  }
  writer.close();
};

module.exports = georacingToParquet;

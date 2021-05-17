const parquet = require('parquetjs-lite');

const { kattackCombined } = require('../schemas/parquets/kattack');

const kattackToParquet = async (data, filePath) => {
  const writer = await parquet.ParquetWriter.openFile(
    kattackCombined,
    filePath,
    {
      useDataPageV2: false,
    },
  );

  for (let i = 0; i < data.length; i++) {
    const { yachtClubs, races, devices, positions, waypoints } = data[i];
    await writer.appendRow({
      yachtClubs: JSON.stringify(yachtClubs),
      races: JSON.stringify(races),
      devices: JSON.stringify(devices),
      positions: JSON.stringify(positions),
      waypoints: JSON.stringify(waypoints),
    });
  }
  writer.close();
};

module.exports = kattackToParquet;

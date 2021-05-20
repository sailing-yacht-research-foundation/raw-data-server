const parquet = require('parquetjs-lite');

const readParquet = async (filePath) => {
  const reader = await parquet.ParquetReader.openFile(filePath);
  let cursor = reader.getCursor();
  let record = null;
  let fullData = [];
  while ((record = await cursor.next())) {
    fullData.push(record);
  }
  await reader.close();
  return fullData;
};

module.exports = readParquet;

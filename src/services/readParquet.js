const parquet = require('parquetjs-lite');

const readParquet = async (filePath, processRecord) => {
  const reader = await parquet.ParquetReader.openFile(filePath);
  let cursor = reader.getCursor();
  let record = null;
  while ((record = await cursor.next())) {
    processRecord(record);
  }
  await reader.close();
  return true;
};

module.exports = readParquet;

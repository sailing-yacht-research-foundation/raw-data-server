const parquet = require('parquetjs-lite');

const readParquet = async (filePath, processRecord) => {
  let reader;
  let errorMessage = null;
  try {
    reader = await parquet.ParquetReader.openFile(filePath);
    let cursor = reader.getCursor();
    let record = null;
    while ((record = await cursor.next())) {
      processRecord(record);
    }
    await reader.close();
  } catch (error) {
    if (reader) {
      reader.close();
    }
    errorMessage = error.message;
  }

  return { success: errorMessage ? false : true, errorMessage };
};

module.exports = readParquet;

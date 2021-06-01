const parquet = require('parquetjs-lite');

const writeToParquet = async (data, schema, filePath) => {
  let writer;
  let i;
  let errorDetail = null;
  try {
    writer = await parquet.ParquetWriter.openFile(schema, filePath, {
      useDataPageV2: false,
    });
    for (i = 0; i < data.length; i++) {
      await writer.appendRow(data[i]);
    }
    await writer.close();
  } catch (error) {
    if (writer) {
      errorDetail = {
        errorMessage: `Parquet writing fails on data #${i}, error: ${error}`,
        currentRecord: data[i],
      };
      writer.close();
    } else {
      errorDetail = {
        errorMessage: error.message,
        currentRecord: null,
      };
    }
  }
  return { success: errorDetail ? false : true, errorDetail };
};

module.exports = writeToParquet;

const parquet = require('parquetjs-lite');

const writeToParquet = async (data, schema, filePath) => {
  let writer;
  let i;
  try {
    writer = await parquet.ParquetWriter.openFile(schema, filePath, {
      useDataPageV2: false,
    });
    for (i = 0; i < data.length; i++) {
      await writer.appendRow(data[i]);
    }
    await writer.close();
  } catch (error) {
    console.error(`Parquet writing fails on data #${i}, error: ${error}`);
    console.table([data[i]]);
    if (writer) {
      writer.close();
    }
  }
};

module.exports = writeToParquet;

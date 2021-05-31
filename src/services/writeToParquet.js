const parquet = require('parquetjs-lite');

const writeToParquet = async (data, schema, filePath) => {
  const writer = await parquet.ParquetWriter.openFile(schema, filePath, {
    useDataPageV2: false,
  });

  for (let i = 0; i < data.length; i++) {
    try {
      await writer.appendRow(data[i]);
    } catch (error) {
      console.log(data[i]);
      console.error(error);
    }
  }
  await writer.close();
};

module.exports = writeToParquet;

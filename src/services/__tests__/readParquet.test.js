const path = require('path');

const readParquet = require('../readParquet');

describe('Read data from Parquet files', () => {
  it('should read parquet files successfully', async () => {
    const filePath = path.resolve(
      __dirname,
      '../../test-files/georacing.parquet',
    );
    const data = await readParquet(filePath);
    expect(Array.isArray(data)).toEqual(true);
    expect(data.length).toEqual(2);
  });
});

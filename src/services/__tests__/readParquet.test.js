const path = require('path');

const readParquet = require('../readParquet');

describe('Basic read parquet functionality', () => {
  it('should read parquet files successfully', async () => {
    const filePath = path.resolve(
      __dirname,
      '../../test-files/georacing.parquet',
    );
    const processRecord = jest.fn();
    await readParquet(filePath, processRecord);
    expect(processRecord).toHaveBeenCalledTimes(2);
  });
});

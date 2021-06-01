const fs = require('fs');
const parquet = require('parquetjs-lite');
const temp = require('temp').track();

const writeToParquet = require('../writeToParquet');

describe('Write data to Parquet files', () => {
  let dirPath = '';
  beforeAll(async () => {
    dirPath = await temp.mkdir('rds-parquet');
  });

  test('Successfully created a parquet', async () => {
    const fileName = 'test.parquet';
    const path = `${dirPath}/${fileName}`;
    const theSchema = new parquet.ParquetSchema({
      id: { type: 'UTF8' },
      name: { type: 'UTF8' },
    });
    const writeResult = await writeToParquet(
      [
        {
          id: '1',
          name: 'Tester',
        },
      ],
      theSchema,
      path,
    );
    expect(writeResult).toEqual({ success: true, errorDetail: null });
    expect(fs.existsSync(path)).toEqual(true);
    temp.cleanup();
  });

  test('Failed to create a parquet when data-type is incorrect', async () => {
    const fileName = 'test.parquet';
    const path = `${dirPath}/${fileName}`;
    const theSchema = new parquet.ParquetSchema({
      id: { type: 'UTF8' },
      name: { type: 'UTF8' },
      age: { type: 'INT32' },
    });
    const secondRecord = {
      id: '2',
      name: 'Tester 2',
      age: 'Twenty',
    };
    const writeResult = await writeToParquet(
      [
        {
          id: '1',
          name: 'Tester',
          age: 20,
        },
        secondRecord,
      ],
      theSchema,
      path,
    );
    expect(writeResult).toEqual({
      success: false,
      errorDetail: {
        errorMessage:
          'Parquet writing fails on data #1, error: invalid value for INT32: Twenty',
        currentRecord: secondRecord,
      },
    });
    temp.cleanup();
  });

  test('Failed when writer unable to open the file', async () => {
    const path = `randomfolder/test.parquet`;
    const theSchema = new parquet.ParquetSchema({
      id: { type: 'UTF8' },
      name: { type: 'UTF8' },
      age: { type: 'INT32' },
    });
    const writeResult = await writeToParquet(
      [
        {
          id: '1',
          name: 'Tester',
          age: 20,
        },
      ],
      theSchema,
      path,
    );
    expect(writeResult).toEqual(
      expect.objectContaining({
        success: false,
        errorDetail: {
          currentRecord: null,
          errorMessage: expect.stringContaining('ENOENT'),
        },
      }),
    );
    temp.cleanup();
  });
});

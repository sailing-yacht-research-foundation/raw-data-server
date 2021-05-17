const yyyymmddFormat = require('../yyyymmddFormat');

describe('Generate YYYYMMDD format', () => {
  test('Return current date format without parameter', () => {
    const result = yyyymmddFormat();
    const currentDate = new Date();
    expect(result).toEqual(
      `${currentDate.getUTCFullYear()}${String(
        currentDate.getUTCMonth() + 1,
      ).padStart(2, '0')}${currentDate.getUTCDate()}`,
    );
  });

  test('Successfully format with parameter', () => {
    const result = yyyymmddFormat('2021-05-28');
    expect(result).toEqual(`20210528`);
  });
});

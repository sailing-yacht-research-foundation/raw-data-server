const generateDateAuthFormat = require('../generateDateAuthFormat');

describe('Generate Date for Auth format', () => {
  test('Successfully return date with format', () => {
    const result = generateDateAuthFormat('2021-05-28');
    expect(result).toEqual(`2021 May 28, Fri`);
  });
});

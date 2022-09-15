const { generateDateAuthFormat, generateSecret } = require('../authUtils');

describe('Generate Date for Auth format', () => {
  test('Successfully return date with format', () => {
    const result = generateDateAuthFormat('2021-05-28');
    expect(result).toEqual(`2021 May 28, Fri`);
  });
});

describe('Generate secret for authentication', () => {
  test('Successfully return a secure hash from a string', () => {
    process.env.SIMPLE_AUTH_SALT = 'd7638826-34c5-11ed-a261-0242ac120002';
    const result = generateSecret('this is a secret');
    expect(result).toEqual('c9af9f844c95d110cefe312c8e8946ea');
  });
});

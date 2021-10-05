const generateSecret = require('../generateSecret');

describe('Generate secret for authentication', () => {
  test('Successfully return a secure hash from a string', () => {
    const result = generateSecret('this is a secret');
    expect(result).toEqual('7dbbcee180ba4d456e4aa1cfbdad9c7b');
  });
});

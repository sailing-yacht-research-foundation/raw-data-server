const {
  ValidationError,
  BaseError,
  SequelizeScopeError,
} = require('sequelize');
const databaseErrorHandler = require('../databaseErrorHandler');

describe('Handle Error from DB Error', () => {
  test('Successfully return error message', () => {
    const firstError = new BaseError('Invalid');
    const firstErrorMessage = databaseErrorHandler(firstError);

    expect(firstErrorMessage).toEqual('Invalid');

    const secondError = new ValidationError('Validation Error', [
      new Error('Data Invalid'),
      new Error('Function Invalid'),
    ]);
    const secondErrorMessage = databaseErrorHandler(secondError);

    expect(secondErrorMessage).toEqual('Data Invalid, Function Invalid');

    const thirdError = new SequelizeScopeError();
    const thirdErrorMessage = databaseErrorHandler(thirdError);

    expect(thirdErrorMessage).toEqual('Database Error');
  });
});

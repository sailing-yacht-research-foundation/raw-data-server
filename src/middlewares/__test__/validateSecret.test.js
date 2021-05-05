const validateSecret = require('../validateSecret');
const { AuthNotSetError, AuthInvalidError } = require('../../errors');
const generateSecret = require('../../utils/generateSecret');
const generateDateAuthFormat = require('../../utils/generateDateAuthFormat');

describe('Validate Secret middleware', () => {
  let mockRequest;
  let mockResponse;
  let nextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      json: jest.fn(),
    };
  });

  test('Without Authorization', async () => {
    try {
      validateSecret(mockRequest, mockResponse, nextFunction);
    } catch (error) {
      expect(error).toBeInstanceOf(AuthNotSetError);
    }
  });

  test('With Incorrect Authorization', async () => {
    mockRequest = {
      headers: {
        Authorization: 'abcdef',
      },
    };
    try {
      validateSecret(mockRequest, mockResponse, nextFunction);
    } catch (error) {
      expect(error).toBeInstanceOf(AuthInvalidError);
    }
  });

  test('With Correct Authorization', async () => {
    mockRequest = {
      headers: {
        Authorization: generateSecret(generateDateAuthFormat()),
      },
    };
    validateSecret(mockRequest, mockResponse, nextFunction);
    expect(nextFunction).toBeCalledTimes(1);
  });
});

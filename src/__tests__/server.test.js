const supertest = require('supertest');
const path = require('path');

const createServer = require('../server');
const generateDateAuthFormat = require('../utils/generateDateAuthFormat');
const generateSecret = require('../utils/generateSecret');
const saveISailData = require('../services/saveISailData');

jest.mock('../services/saveISailData', () => jest.fn());

describe('Test Endpoints', () => {
  let app;
  beforeAll(() => {
    app = createServer();
  });
  afterAll(async () => {
    jest.resetAllMocks();
    await app.close();
  });
  test('GET /', async (done) => {
    await supertest(app)
      .get('/')
      .expect(200)
      .then((response) => {
        expect(response.text).toBe('SYRF - Raw Data Server');
        done();
      });
  });

  test('GET /api/v1', async (done) => {
    await supertest(app).get('/api/v1').expect(400);
    await supertest(app)
      .get('/api/v1')
      .set({
        Authorization: 'randomtoken',
      })
      .expect(403);
    let secret = generateSecret(generateDateAuthFormat());
    await supertest(app)
      .get('/api/v1')
      .set({
        Authorization: secret,
      })
      .expect(200)
      .then(() => {
        done();
      });
  });

  test('POST /api/v1/upload-file', async () => {
    let secret = generateSecret(generateDateAuthFormat());
    const badFile = await supertest(app)
      .post('/api/v1/upload-file')
      .set({
        Authorization: secret,
      })
      .attach('raw_data', path.resolve(__dirname, '../test-files/text.txt'));
    expect(badFile.status).toBe(400);

    const noFile = await supertest(app).post('/api/v1/upload-file').set({
      Authorization: secret,
    });
    expect(noFile.status).toBe(400);

    const response = await supertest(app)
      .post('/api/v1/upload-file')
      .set({
        Authorization: secret,
      })
      .attach('raw_data', path.resolve(__dirname, '../test-files/iSail.json'));
    expect(response.status).toBe(200);
    expect(saveISailData).toHaveBeenCalledTimes(1);
  });
});

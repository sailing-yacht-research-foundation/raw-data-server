const supertest = require('supertest');

const createServer = require('../server');
const generateDateAuthFormat = require('../utils/generateDateAuthFormat');
const generateSecret = require('../utils/generateSecret');

describe('Test Endpoints', () => {
  let app;
  beforeAll(() => {
    app = createServer();
  });
  afterAll(async () => {
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

  test('GET /api', async (done) => {
    await supertest(app).get('/api').expect(400);
    await supertest(app)
      .get('/api')
      .set({
        Authorization: 'randomtoken',
      })
      .expect(403);
    let secret = generateSecret(generateDateAuthFormat());
    await supertest(app)
      .get('/api')
      .set({
        Authorization: secret,
      })
      .expect(200)
      .then(() => {
        done();
      });
  });
});

const supertest = require('supertest');
const crypto = require('crypto');

const createServer = require('../server');
const { formatDateAuth } = require('../utils/dateFormatter');

const app = createServer();

test('GET /', async () => {
  await supertest(app)
    .get('/')
    .expect(200)
    .then((response) => {
      expect(response.text).toBe('SYRF - Raw Data Server');
    });
});

test('GET /api', async () => {
  await supertest(app).get('/api').expect(400);
  await supertest(app)
    .get('/api')
    .set({
      Authorization: 'randomtoken',
    })
    .expect(403);
  let secret = crypto.createHash('md5').update(formatDateAuth()).digest('hex');
  await supertest(app)
    .get('/api')
    .set({
      Authorization: secret,
    })
    .expect(200);
});

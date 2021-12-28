const axios = require('axios');
jest.unmock('../elasticsearch');
jest.mock('axios', () => ({
  create: jest.fn().mockReturnThis(),
  put: jest.fn(),
}));

describe('elasticsearch.js', () => {
  describe('When indexRace is called', () => {
    let oldEnvHost;
    beforeAll(() => {
      oldEnvHost = process.env.AWS_ES_HOST;
      process.env.AWS_ES_HOST = 'http://test-elasticsearch';
    })
    afterEach(() => {
      process.env.AWS_ES_HOST = oldEnvHost;
      jest.restoreAllMocks();
    })

    it('should index race data', async () => {
      const { indexRace } = require('../elasticsearch');
      const raceId = 'raceid';
      const raceData = {
        id: raceId,
        name: 'test race',
      };
      const fakedResp = { id: raceId };
      axios.put.mockResolvedValueOnce(fakedResp)

      const r = await indexRace('raceid', raceData);
      expect(axios.put).toHaveBeenCalledWith(
        `races/_doc/${raceId}`,
        raceData);
      expect(r).toEqual(fakedResp);
    });

    it('should throw error in case of failure', async () => {
      const { indexRace } = require('../elasticsearch');
      const raceId = 'raceid';
      const raceData = {
        id: raceId,
        name: 'test race',
      };
      const fakedError = 'Faked error';
      axios.put.mockRejectedValueOnce(fakedError);

      try {
        await indexRace('raceid', raceData);
      } catch (err) {
        expect(err).toEqual(fakedError);
        expect(axios.put).toHaveBeenCalledWith(
          `races/_doc/${raceId}`,
          raceData);
      }
    });
  });
});

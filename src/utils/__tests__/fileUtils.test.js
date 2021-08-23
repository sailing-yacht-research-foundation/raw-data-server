const fs = require('fs');
const csvtojson = require('csvtojson');

const {
  listDirectories,
  readXmlFileToJson,
  readCsvFileToJson,
} = require('../fileUtils');

jest.mock('csvtojson');

describe('fileUtil.js', () => {
  const existingPath = 'existingPath';
  const expectedJson = {
    "Race": {
      "RaceID": "123",
      "Course": {
        "CompoundMark": [{
          "Name": "Mark0",
          "Mark": [{
            "SeqID": "1",
          }, {
            "SeqID": "2",
          }]
        }, {
          "Name": "Mark1",
          "Mark": [{
            "SeqID": "3",
          }, {
            "SeqID": "4",
          }]
        }]
      }
    }
  };

  describe('When listDirectories is called', () => {
    let readdirSyncSpy;
    const mockDirValues = [
      {
        name: 'csv',
        isDirectory: () => true,
      },
      {
        name: 'stowe.txt',
        isDirectory: () => false,
      },
      {
        name: 'history',
        isDirectory: () => true,
      },
    ];

    beforeAll(() => {
      readdirSyncSpy = jest.spyOn(fs, 'readdirSync').mockReturnValue(mockDirValues);
    });
    afterAll(() => {
      readdirSyncSpy.restore();
    });

    it('should call readdirsync, filter with directory only and return the names', () => {
      const result = listDirectories(existingPath);
      expect (readdirSyncSpy).toHaveBeenCalledWith(existingPath, expect.anything());
      expect(result).toEqual(['csv', 'history']);
    });
  });

  describe('When readXmlFileToJson is called', () => {
    const mockXml = `
      <Race>
        <RaceID>${expectedJson.Race.RaceID}</RaceID>
        <Course>
          <CompoundMark Name="${expectedJson.Race.Course.CompoundMark[0].Name}">
            <Mark SeqID="${expectedJson.Race.Course.CompoundMark[0].Mark[0].SeqID}"/>
            <Mark SeqID="${expectedJson.Race.Course.CompoundMark[0].Mark[1].SeqID}"/>
          </CompoundMark>
          <CompoundMark Name="${expectedJson.Race.Course.CompoundMark[1].Name}">
            <Mark SeqID="${expectedJson.Race.Course.CompoundMark[1].Mark[0].SeqID}"/>
            <Mark SeqID="${expectedJson.Race.Course.CompoundMark[1].Mark[1].SeqID}"/>
          </CompoundMark>
        </Course>
      </Race>
    `;

    beforeEach(() => {
      jest.spyOn(fs, 'existsSync').mockImplementation((path) => path === existingPath);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(mockXml);
    });
    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should return undefined if path does not exist', () => {
      const result = readXmlFileToJson('doesnotexistpath');
      expect(result).toBeUndefined();
    });

    it('should return json representation of xml if path exist', () => {
      const result = readXmlFileToJson(existingPath);
      expect(result).toEqual(expectedJson)
    })
  });

  describe('When readCsvFileToJson is called', () => {
    let fromFileSpy;
    beforeEach(() => {
      jest.spyOn(fs, 'existsSync').mockImplementation((path) => path === existingPath);
      fromFileSpy = jest.fn().mockResolvedValue(expectedJson);
      csvtojson.mockImplementation(() => ({ fromFile: fromFileSpy }));
    });
    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should return undefined if path does not exist', async () => {
      const result = await readXmlFileToJson('doesnotexistpath');
      expect(result).toBeUndefined();
    });

    it('should return json representation of csv if path exist', async () => {
      const result = await readCsvFileToJson(existingPath);
      expect(result).toEqual(expectedJson)
      expect(fromFileSpy).toHaveBeenCalledWith(existingPath);
    })
  });
});

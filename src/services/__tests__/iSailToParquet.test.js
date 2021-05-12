const fs = require('fs');
const temp = require('temp').track();

const { iSailEventToParquet } = require('../iSailToParquet');

describe('Storing iSail Data to Parquet', () => {
  let dirPath = '';
  beforeAll(async () => {
    dirPath = await temp.mkdir('rds-parquet');
  });

  test('Create iSailEvent Parquet', async () => {
    const fileName = 'testing.parquet';
    const path = `${dirPath}/${fileName}`;
    await iSailEventToParquet(
      [
        {
          id: 'd451063e-b576-4b23-8638-457e68cb6c26',
          original_id: '13',
          name: 'DiZeBra 20150421',
          start_date: '2015-04-21 00:00:00.000000',
          start_timezone_type: '3',
          start_timezone: 'Europe/Paris',
          stop_date: '2015-04-21 00:00:00.000000',
          stop_timezone_type: '3',
          stop_timezone: 'Europe/Paris',
          club: 'WV Braassemermeer',
          location: 'Braassemermeer',
          url: 'http://app.i-sail.com/eventDetails/13',
        },
      ],
      path,
    );

    expect(fs.existsSync(path)).toEqual(true);
    temp.cleanup();
  });
});

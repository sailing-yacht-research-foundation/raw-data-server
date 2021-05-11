const db = require('../../models');
const saveISailData = require('../saveISailData');

describe('Save iSail Data', () => {
  afterAll(async () => {
    await db.iSailClass.destroy({
      truncate: true,
    });
    await db.sequelize.close();
  });
  it('should save iSail Class correctly', async () => {
    const classData = {
      id: '42574d0c-3781-4d72-9ad8-1f41814924d0',
      original_id: '15',
      name: 'Randmeer',
    };
    await saveISailData({
      iSailClass: [classData],
    });
    const result = await db.iSailClass.findAll();
    expect(result.length).toEqual(1);
  });
});

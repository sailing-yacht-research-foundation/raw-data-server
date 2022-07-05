require('dotenv').config();
const uuid = require('uuid');
const { createMapScreenshot } = require('../src/utils/createMapScreenshot');
const uploadUtil = require('../src/utils/uploadUtil');
const syrfDb = require('../src/syrf-schema');

(async () => {
  const bluewaterRaces = await syrfDb.CompetitionUnit.findAll({
    where: {
      openGraphImage: null,
    },
    attributes: ['id', 'approximateStartLocation'],
    raw: true,
    include: [{
      as: 'calendarEvent',
      model: syrfDb.CalendarEvent,
      required: true,
      where: {
        source: 'KWINDOO'  // Change by source to make sure it does not update unnecessary records
      },
      attributes: ['source']
    }]
  })
  console.log(`Got ${bluewaterRaces.length} races. Processing`)
  for (const r of bluewaterRaces) {
    console.log(`Processing race with id ${r.id}`);
    const startPoint = r.approximateStartLocation;
    try {
      const imageBuffer = await createMapScreenshot(
        startPoint.coordinates,
      );
      const response = await uploadUtil.uploadDataToS3({
        ACL: 'public-read',
        Bucket: process.env.OPEN_GRAPH_BUCKET_NAME,
        Key: `public/competition/${r.id}/${uuid.v4()}.jpg`,
        Body: imageBuffer,
        ContentType: 'image/jpeg',
      });
      const openGraphImage = response?.Location;
      if (openGraphImage) {
        console.log('openGraphImage', openGraphImage);
        await syrfDb.CompetitionUnit.update({
          openGraphImage,
        }, {
          where: {
            id: r.id,
          }
        })
      }
    } catch (error) {
      // Logging only, if not successfully created, we can skip the open graph image
      console.error(
        `Failed to create mapshot for scraped race: ${r.id}, error: ${error.message}`,
      );
    }
  }
})();

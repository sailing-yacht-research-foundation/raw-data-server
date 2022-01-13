require('dotenv').config();
const fs = require('fs');
const s3Util = require('../src/services/s3Util');
const logFailureFileName = 'OpenGraphCopyFailure.json';

/**
 * This script copies the objects in open graph images bucket to remove the ContentEncoding of base 64 metadata
 * because it is not supported by facebook and it is failing to show the og image
 *
 */
(async () => {
  const ogBucketName = process.env.OPEN_GRAPH_BUCKET_NAME;
  const opengraphImages = await s3Util.listAllKeys(ogBucketName, 'public');
  console.log('opengraphImages.length', opengraphImages.length);
  const failedFilenames = [];
  for (const ogImageName of opengraphImages) {
    console.log(`Copying filename ${ogImageName}`);
    try {
      await s3Util.copyObject({
        ACL: 'public-read',
        Bucket: ogBucketName,
        CopySource: `${ogBucketName}/${ogImageName}`,
        Key: ogImageName,
        ContentType: ogImageName.indexOf('.png') > -1 ? 'image/png' : 'image/jpeg',
        MetadataDirective: 'REPLACE',
      });
    } catch (err) {
      console.log(`Failed copying object ${ogImageName}`, err);
      failedFilenames.push(ogImageName);
    }
  }

  if (failedFilenames.length) {
    fs.appendFileSync(logFailureFileName, `['${failedFilenames.join("','")}']`);
  }
  console.log('Failed deletion log can be found here ', logFailureFileName);
})();

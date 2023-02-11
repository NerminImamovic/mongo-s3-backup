import path from 'path';
import fs from 'fs';
import AWS from 'aws-sdk';
import exec from './exec.js';

AWS.config.update({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
});

const uri = process.env.URI;
const backupName = process.env.BACKUP_NAME;
const bucket = process.env.BUCKET;

(async () => {
  const s3 = new AWS.S3();
  const __dirname = path.resolve();

  const dumpPath = path.resolve(__dirname, backupName);

  const command = `mongodump --uri '${uri}' --gzip --archive=${dumpPath}`;

  try {
    await exec(command);

    const readStream = fs.createReadStream(dumpPath);
    const params = {
      Bucket: bucket,
      Key: backupName,
      Body: readStream,
    };

    await s3.putObject(params).promise();

    console.log('Successful backup!');
  } catch (err) {
    console.log(`Backup failed: ${err}`);
  }
})();
